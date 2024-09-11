# TestY TMS - Test Management System
# Copyright (C) 2024 KNS Group LLC (YADRO)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# Also add information on how to contact you by electronic and paper mail.
#
# If your software can interact with users remotely through a computer
# network, you should also make sure that it provides a way for users to
# get its source.  For example, if your program is a web application, its
# interface could display a "Source" link that leads users to an archive
# of the code.  There are many ways you could offer source, and different
# solutions will be better for different programs; see section 13 for the
# specific requirements.
#
# You should also get your employer (if you work as a programmer) or school,
# if any, to sign a "copyright disclaimer" for the program, if necessary.
# For more information on this, and how to apply and follow the GNU AGPL, see
# <http://www.gnu.org/licenses/>.
import operator
from functools import reduce

from django.contrib.postgres.aggregates import StringAgg
from django.db.models import F, Q, TextField, Value
from django.db.models.functions import Concat
from django_filters import BaseCSVFilter
from django_filters import rest_framework as filters
from rest_framework.filters import SearchFilter
from simple_history.utils import get_history_model_for_model

from testy.filters import ArchiveFilterMixin, FilterListMixin, TreeSearchBaseFilter, project_filter
from testy.tests_description.selectors.suites import TestSuiteSelector
from testy.tests_representation.models import Parameter, ResultStatus, Test, TestPlan, TestResult
from testy.tests_representation.selectors.testplan import TestPlanSelector
from testy.tests_representation.services.statistics import LabelProcessor
from testy.utilities.request import get_boolean
from testy.utilities.string import parse_int


class TestPlanFilter(ArchiveFilterMixin):
    project = project_filter()
    parameters = filters.BaseCSVFilter('parameter_ids', method='filter_by_parameters')
    parent = filters.CharFilter('parent', method='filter_by_parent')
    ordering = filters.OrderingFilter(
        fields=(
            ('started_at', 'started_at'),
            ('created_at', 'created_at'),
            ('name', 'name'),
        ),
    )

    @classmethod
    def filter_by_parameters(cls, queryset, field_name, parameter_ids):
        for parameter_id in parameter_ids:
            queryset = queryset.filter(parameters__id=parameter_id)
        return queryset

    @classmethod
    def filter_by_parent(cls, queryset, field_name, parent):
        lookup = Q()
        if parent == 'null':
            lookup = Q(**{f'{field_name}__isnull': True})
        elif parent_id := parse_int(parent):
            lookup = Q(**{f'{field_name}__id': parent_id})
        return queryset.filter(lookup)

    class Meta:
        model = TestPlan
        fields = ('parent',)


class TestFilter(ArchiveFilterMixin):
    project = project_filter()
    assignee = filters.NumberFilter()
    unassigned = filters.BooleanFilter(field_name='assignee', lookup_expr='isnull')
    suite = filters.BaseCSVFilter('case__suite_id', method='filter_by_suite')
    labels = filters.BaseCSVFilter(method='filter_by_labels')
    not_labels = filters.BaseCSVFilter(method='filter_by_labels')
    last_status = filters.BaseCSVFilter(field_name='last_status', method='filter_by_last_status')

    ordering = filters.OrderingFilter(
        fields=(
            ('id', 'id'),
            ('last_status', 'last_status'),
            ('created_at', 'created_at'),
            ('case__name', 'name'),
            ('is_archive', 'is_archive'),
            ('assignee', 'assignee'),
            ('assignee__username', 'assignee_username'),
            ('suite_path', 'suite_path'),
        ),
    )

    def filter_by_suite(self, queryset, field_name, suite_ids):
        filter_conditons = {f'{field_name}__in': suite_ids}
        if get_boolean(self.request, 'nested_search'):
            suites = TestSuiteSelector.suites_by_ids(suite_ids, 'pk')
            suite_ids = suites.get_descendants(include_self=True).values_list('id', flat=True)
            filter_conditons = {f'{field_name}__in': suite_ids}
        return queryset.filter(**filter_conditons)

    def filter_by_labels(self, queryset, *args):
        filter_condition = {}
        for key in ('labels', 'not_labels'):
            labels = self.data.get(key)
            filter_condition[key] = tuple(labels.split(',')) if labels else None
        filter_condition['labels_condition'] = self.data.get('labels_condition')
        statistic_processor = LabelProcessor(filter_condition)
        if statistic_processor.labels or statistic_processor.not_labels:
            queryset = statistic_processor.process_labels(queryset)
        return queryset

    @classmethod
    def filter_by_last_status(cls, queryset, field_name: str, statuses):
        filter_conditions = Q(**{f'{field_name}__in': statuses})
        if 'null' in statuses:
            statuses.remove('null')
            filter_conditions |= Q(**{f'{field_name}__isnull': True})
        return queryset.filter(filter_conditions)

    class Meta:
        model = Test
        fields = ('plan', 'case')


class TestFilterNested(TestFilter):
    project = filters.NumberFilter('project')


class TestResultFilter(ArchiveFilterMixin):
    project = project_filter()

    class Meta:
        model = TestResult
        fields = ('test',)


class ParameterFilter(filters.FilterSet):
    project = project_filter()

    class Meta:
        model = Parameter
        fields = ('project',)


class NumberInFilter(filters.BaseInFilter, filters.NumberFilter):
    """Class for filtering by __in condition for integers."""


class StringInFilter(filters.BaseInFilter, filters.CharFilter):
    """Class for filtering by __in condition for integers."""


class ActivityFilter(filters.FilterSet, FilterListMixin):
    history_user = NumberInFilter(field_name='history_user')
    status = BaseCSVFilter(field_name='status', method='filter_by_list')
    history_type = StringInFilter(field_name='history_type')
    test = NumberInFilter(field_name='test')
    ordering = filters.OrderingFilter(
        fields=(
            ('history_user', 'history_user'),
            ('history_date', 'history_date'),
            ('history_type', 'history_type'),
            ('test__case__name', 'test__case__name'),
        ),
    )

    class Meta:
        model = get_history_model_for_model(TestResult)
        fields = ('id',)


class ActivitySearchFilter(SearchFilter):
    def filter_queryset(self, request, queryset):
        search_fields = ['history_user__username', 'test__case__name', 'history_date']
        search_terms = self.get_search_terms(request)

        orm_lookups = [
            self.construct_search(search_field)
            for search_field in search_fields
        ]

        if not search_fields or not search_terms:
            return queryset

        conditions = []
        for search_term in search_terms:
            queries = [
                Q(**{orm_lookup: search_term})
                for orm_lookup in orm_lookups
            ]
            conditions.append(reduce(operator.or_, queries))
        return queryset.filter(reduce(operator.and_, conditions))


class TestPlanSearchFilter(TreeSearchBaseFilter):
    children_field_name = 'child_test_plans'
    max_level_method = TestPlanSelector.get_max_level
    model_class = TestPlan

    def get_ancestors(self, valid_options):
        return super().get_ancestors(valid_options).prefetch_related('parameters')

    def get_valid_options(self, filter_conditions, request):
        additional_filters = {
            'project_id': request.query_params.get('project'),
        }
        if not get_boolean(request, 'is_archive'):
            additional_filters['is_archive'] = False

        return self.model_class.objects.annotate(
            title=Concat(
                F('name'),
                Value(' '),
                Value('['),
                StringAgg('parameters__data', delimiter=', '),
                Value(']'),
                output_field=TextField(),
            ),
        ).filter(
            filter_conditions,
            **additional_filters,
        )


class ResultStatusFilter(filters.FilterSet):
    class Meta:
        model = ResultStatus
        fields = ('type',)

# TestY TMS - Test Management System
# Copyright (C) 2022 KNS Group LLC (YADRO)
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
from typing import Callable

from django.contrib.auth import get_user_model
from django.contrib.postgres.aggregates import StringAgg
from django.db.models import F, Model, OuterRef, Prefetch, Q, QuerySet, Subquery, TextField, Value
from django.db.models.functions import Concat
from django_filters import BaseCSVFilter
from django_filters import rest_framework as filters
from notifications.models import Notification
from rest_framework.exceptions import NotFound
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import get_object_or_404

from testy.core.models import Attachment, CustomAttribute, Label, NotificationSetting, Project
from testy.core.selectors.projects import ProjectSelector
from testy.tests_description.models import TestCase, TestSuite
from testy.tests_description.selectors.suites import TestSuiteSelector
from testy.tests_representation.models import Parameter, Test, TestPlan, TestResult
from testy.tests_representation.selectors.results import TestResultSelector
from testy.tests_representation.selectors.testplan import TestPlanSelector
from testy.tests_representation.services.statistics import StatisticProcessor
from testy.utilities.request import get_boolean, get_user_favorites
from testy.utilities.string import parse_bool_from_str, parse_int
from testy.utilities.tree import form_tree_prefetch_lookups

UserModel = get_user_model()


class FilterListMixin:
    @classmethod
    def filter_by_list(cls, queryset: QuerySet[Model], field_name: str, values_list: list[str]) -> QuerySet[Model]:
        lookup = Q(**{f'{field_name}__in': values_list})
        if 'null' in values_list:
            values_list.remove('null')
            lookup |= Q(**{f'{field_name}__isnull': True})
        return queryset.filter(lookup)


class FlatFilterMixin:
    @classmethod
    def filter_queryset_flat(cls: filters.FilterSet, queryset: QuerySet[Model], request) -> QuerySet[Model]:
        for param_name, param_value in request.query_params.items():
            filter_instance = cls.base_filters.get(param_name)
            if not filter_instance:
                continue
            if isinstance(filter_instance, OrderingFilter):
                param_value = param_value.split(',')
            queryset = filter_instance.filter(queryset, param_value)
        return queryset


class TestyFilterBackend(filters.DjangoFilterBackend):
    def get_filterset_kwargs(self, request, queryset, view):
        kwargs = super().get_filterset_kwargs(request, queryset, view)
        kwargs.update({'action': view.action})
        return kwargs


class BaseProjectFilter(filters.FilterSet):
    def __init__(self, *args, action=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.action = action

    def filter_queryset(self, queryset):
        if self.data.get('project') is None and self.action == 'list':
            raise NotFound('Project id was not provided in query params')
        return super().filter_queryset(queryset)


class TestSuiteFilter(BaseProjectFilter):
    class Meta:
        model = TestSuite
        fields = ('project', 'parent')


class ArchiveFilter(BaseProjectFilter):

    def filter_queryset(self, queryset):
        if not parse_bool_from_str(self.data.get('is_archive')) and self.action == 'list':
            queryset = queryset.filter(is_archive=False)
        return super().filter_queryset(queryset)


class ProjectArchiveFilter(filters.FilterSet):

    def __init__(self, *args, action=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.action = action

    def filter_queryset(self, queryset):
        if not parse_bool_from_str(self.data.get('is_archive')) and self.action == 'list':
            queryset = queryset.filter(is_archive=False)
        return super().filter_queryset(queryset)


class ProjectOrderingFilter(OrderingFilter):

    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        favorite_conditions = Q(pk__in=get_user_favorites(request))
        if ordering:
            queryset = queryset.annotate(priority=ProjectSelector.favorites_annotation(favorite_conditions))
            return queryset.order_by('priority', *ordering)

        return queryset


class ProjectFilter(ProjectArchiveFilter):
    name = filters.CharFilter(lookup_expr='icontains')
    favorites = filters.BooleanFilter('pk', method='display_favorites')

    class Meta:
        model = Project
        fields = ('name', 'favorites')

    def display_favorites(self, queryset, field_name, only_favorites):
        favorite_conditions = Q(**{f'{field_name}__in': get_user_favorites(self.request)})

        if only_favorites:
            return queryset.filter(favorite_conditions).order_by('name')

        return (
            queryset
            .annotate(
                priority=ProjectSelector.favorites_annotation(favorite_conditions),
            )
            .order_by('priority', 'name')
        )


class TestCaseFilter(BaseProjectFilter, FlatFilterMixin):
    name = filters.CharFilter(lookup_expr='icontains')
    labels = filters.BaseInFilter(method='filter_by_labels')

    def filter_by_labels(self, queryset, field_name, label_ids: list[int]):
        if self.action == 'cases_search':
            return self._filter_search(queryset, label_ids)
        filter_condition = {
            'labels': label_ids,
            'labels_condition': self.request.query_params.get('labels_condition', 'or'),
        }
        processor = StatisticProcessor(filter_condition, outer_ref_prefix=None)
        return processor.process_labels(queryset)

    def _filter_search(self, queryset, label_ids: list[int]):
        oper = operator.or_ if self.request.query_params.get('labels_condition') == 'or' else operator.and_
        lookups = [Q(label_ids__contains=[label_id]) for label_id in label_ids]
        lookup = reduce(oper, lookups)
        return queryset.filter(lookup)

    class Meta:
        model = TestCase
        fields = ('id', 'project', 'suite', 'name', 'labels')


class ParameterFilter(BaseProjectFilter):
    class Meta:
        model = Parameter
        fields = ('project',)


class AttachmentFilter(BaseProjectFilter):
    class Meta:
        model = Attachment
        fields = ('project',)


class LabelFilter(BaseProjectFilter):
    class Meta:
        model = Label
        fields = ('project',)


class CustomAttributeFilter(BaseProjectFilter):
    suite = filters.NumberFilter(field_name='suite_ids', method='filter_by_suite')
    test = filters.NumberFilter(field_name='suite_ids', method='filter_by_test')
    status = filters.NumberFilter(field_name='status_specific', lookup_expr='filter_by_status')

    @classmethod
    def filter_by_suite(cls, queryset, field_name, val):
        non_suite_specific = queryset.filter(is_suite_specific=False)
        suite_specific = queryset.filter(**{f'{field_name}__contains': [val]})
        return non_suite_specific | suite_specific

    @classmethod
    def filter_by_test(cls, queryset, field_name, test_id):
        test = get_object_or_404(Test, pk=test_id)
        lookup = Q(suite_ids__contains=[test.case.suite.id]) | Q(is_suite_specific=False)
        return queryset.filter(lookup)

    @classmethod
    def filter_by_status(cls, queryset, field_name, status: int):
        return queryset.filter(status_specific__contains=[status])

    class Meta:
        model = CustomAttribute
        fields = ('project', 'suite')


class TestPlanFilter(ArchiveFilter):
    def filter_queryset(self, queryset):
        if parameters_str := self.data.get('parameters'):
            for parameter_id in parameters_str.split(','):
                queryset = queryset.filter(parameters__id=parameter_id)
        return super().filter_queryset(queryset)

    class Meta:
        model = TestPlan
        fields = ('project', 'parent')


class TestFilter(ArchiveFilter):
    assignee = filters.NumberFilter()
    unassigned = filters.BooleanFilter(field_name='assignee', lookup_expr='isnull')
    suite = filters.BaseCSVFilter('case__suite_id', method='filter_by_suite')
    labels = BaseCSVFilter(method='filter_by_labels')
    not_labels = BaseCSVFilter(method='filter_by_labels')
    last_status = BaseCSVFilter(field_name='last_status', method='filter_by_last_status')

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
        statistic_processor = StatisticProcessor(filter_condition)
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
        fields = ('project', 'plan')


class TestResultFilter(ArchiveFilter):
    class Meta:
        model = TestResult
        fields = ('project', 'test')


class TestOrderingFilter(OrderingFilter):

    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        if not ordering:
            return queryset
        case_name_subquery = Subquery(
            TestCase.objects.filter(
                pk=OuterRef('case_id'),
            ).values(
                'name',
            )[:1],
        )
        return queryset.annotate(
            last_status=TestResultSelector.get_last_status_subquery(),
            case_name=case_name_subquery,
        ).order_by(*ordering)


class TestyBaseSearchFilter(SearchFilter):
    def construct_orm_lookups(self, search_fields, queryset):
        return [
            self.construct_search(str(search_field), queryset)
            for search_field in search_fields
        ]

    @classmethod
    def custom_filter(cls, queryset, filter_conditions, request):
        return queryset.filter(filter_conditions)

    def filter_queryset(self, request, queryset, view):
        search_fields = self.get_search_fields(view, request)
        search_terms = self.get_search_terms(request)
        distinct_fields = getattr(view, 'distinct_fields', [])

        if not search_fields or not search_terms:
            return queryset

        orm_lookups = self.construct_orm_lookups(search_fields, queryset)

        conditions = []
        for search_term in search_terms:
            queries = [
                Q(**{orm_lookup: search_term})
                for orm_lookup in orm_lookups
            ]
            conditions.append(reduce(operator.or_, queries))

        queryset = self.custom_filter(queryset, reduce(operator.and_, conditions), request)
        if not distinct_fields:
            return queryset
        return queryset


class TreeSearchBaseFilter(TestyBaseSearchFilter):
    children_field_name: str = None
    max_level_method: Callable = None
    model_class = None

    def get_ancestors(self, valid_options):
        return valid_options.get_ancestors(include_self=True)

    def get_valid_options(self, filter_conditions, request):
        return self.model_class.objects.filter(
            filter_conditions,
            project_id=request.query_params.get('project'),
        )

    def custom_filter(self, queryset, filter_conditions, request):
        valid_options = self.get_valid_options(filter_conditions, request)
        if get_boolean(request, 'is_flat'):
            return valid_options
        ancestors = self.get_ancestors(valid_options)
        lookups = form_tree_prefetch_lookups(
            self.children_field_name,
            self.children_field_name,
            self.max_level_method(),
        )
        prefetch_objects = []
        for lookup in lookups:
            prefetch_objects.append(Prefetch(lookup, queryset=ancestors))

        parent_id = parse_int(request.query_params.get('parent', ''))
        parent_lookup = {'parent_id': parent_id} if parent_id else {'parent_id__isnull': True}

        return ancestors.filter(**parent_lookup).prefetch_related(*prefetch_objects)


class TestSuiteSearchFilter(TreeSearchBaseFilter):
    children_field_name = 'child_test_suites'
    max_level_method = TestSuiteSelector.get_max_level
    model_class = TestSuite

    def get_ancestors(self, valid_options):
        return super().get_ancestors(valid_options).annotate(**TestSuiteSelector.cases_count_annotation())

    def custom_filter(self, queryset, filter_conditions, request):
        valid_options = self.get_valid_options(filter_conditions, request)
        if get_boolean(request, 'is_flat'):
            return valid_options.annotate(**TestSuiteSelector.path_annotation())
        max_level = self.max_level_method()
        ancestors = self.get_ancestors(valid_options)
        parent_id = parse_int(request.query_params.get('parent', ''))
        parent_lookup = {'parent_id': parent_id} if parent_id else {'parent_id__isnull': True}
        return ancestors.filter(**parent_lookup).prefetch_related(
            *TestSuiteSelector.suites_tree_prefetch_children(max_level),
        ).annotate(**TestSuiteSelector.cases_count_annotation())


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


class ActivitySearchFilter(SearchFilter):
    def filter_queryset(self, request, queryset):
        search_fields = ['history_user__username', 'test__case__name', 'history_date']
        search_terms = self.get_search_terms(request)

        orm_lookups = [
            self.construct_search(search_field, queryset)
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


class CustomOrderingFilter(OrderingFilter):

    def filter_queryset(self, request, queryset):
        ordering = request.query_params.get('ordering')
        if not ordering:
            return queryset
        ordering = list(map(str.strip, ordering.split(',')))
        return queryset.order_by(*ordering)


class CustomSearchFilter(SearchFilter):
    def filter_queryset(self, request, queryset, allowed_search_params: list[str]):
        filter_lookup = {}
        for query_param_name in allowed_search_params:
            if value := request.query_params.get(query_param_name):
                filter_lookup[f'{query_param_name}__in'] = list(
                    map(str.strip, value.split(',')),
                )
        return queryset.filter(**filter_lookup)


class UserFilter(filters.FilterSet, FilterListMixin, FlatFilterMixin):
    username = filters.CharFilter(lookup_expr='icontains')
    email = filters.CharFilter(lookup_expr='icontains')
    first_name = filters.CharFilter(lookup_expr='icontains')
    last_name = filters.CharFilter(lookup_expr='icontains')
    project = BaseCSVFilter(field_name='memberships__project', method='filter_by_list')

    class Meta:
        model = UserModel
        fields = ('username', 'email', 'first_name', 'last_name', 'is_active', 'is_superuser')


class NotificationFilter(filters.FilterSet):
    ordering = filters.OrderingFilter(
        fields=(
            ('id', 'id'),
            ('unread', 'unread'),
        ),
    )

    class Meta:
        model = Notification
        fields = ('unread',)


class NotificationSettingFilter(filters.FilterSet):
    verbose_name = filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = NotificationSetting
        fields = ('action_code',)

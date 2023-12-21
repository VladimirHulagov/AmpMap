# TestY TMS - Test Management System
# Copyright (C) 2023 KNS Group LLC (YADRO)
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
from typing import Callable, List

from core.models import Attachment, Label, Project
from core.selectors.projects import ProjectSelector
from django.contrib.auth import get_user_model
from django.contrib.postgres.aggregates import StringAgg
from django.db import models
from django.db.models import F, OuterRef, Prefetch, Q, Subquery, Value
from django.db.models.functions import Concat
from django_filters import rest_framework as filters
from rest_framework.compat import distinct
from rest_framework.exceptions import NotFound
from rest_framework.filters import OrderingFilter, SearchFilter
from tests_description.models import TestCase, TestSuite
from tests_description.selectors.suites import TestSuiteSelector
from tests_representation.models import Parameter, Test, TestPlan, TestResult
from tests_representation.selectors.testplan import TestPlanSelector
from tests_representation.services.statistics import StatisticProcessor
from utilities.request import get_boolean, get_user_favorites
from utilities.string import parse_bool_from_str
from utilities.tree import form_tree_prefetch_lookups

UserModel = get_user_model()


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
        favorite_conditions = Q(**{'pk__in': get_user_favorites(request)})
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


class TestCaseFilter(BaseProjectFilter):
    name = filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = TestCase
        fields = ('id', 'project', 'suite', 'name')


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

    def filter_queryset(self, queryset):
        filter_condition = {}
        for key in ('labels', 'not_labels'):
            labels = self.data.get(key)
            filter_condition[key] = tuple(labels.split(',')) if labels else None

        filter_condition['labels_condition'] = self.data.get('labels_condition')

        statistic_processor = StatisticProcessor(filter_condition)
        if statistic_processor.labels or statistic_processor.not_labels:
            queryset = statistic_processor.process_labels(queryset)

        last_status = self.data.get('last_status')
        if last_status:
            last_status = last_status.split(',')
            q_lookup = Q(last_status__in=last_status)
            if 'null' in last_status:
                last_status.remove('null')
                q_lookup = Q(last_status__in=last_status) | Q(last_status__isnull=True)

            queryset = queryset.annotate(
                last_status=Subquery(
                    TestResult.objects.filter(test_id=OuterRef('id')).order_by('-created_at').values('status')[:1]
                ),
            ).filter(q_lookup)
        if suites := self.data.get('suite'):
            queryset = queryset.filter(case__suite__id__in=suites.split(','))
        return super().filter_queryset(queryset)

    class Meta:
        model = Test
        fields = ('project', 'plan')


class TestResultFilter(ArchiveFilter):
    class Meta:
        model = TestResult
        fields = ('project', 'test',)


class TestOrderingFilter(OrderingFilter):

    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        if not ordering:
            return queryset

        return queryset.annotate(
            last_status=Subquery(
                TestResult.objects.filter(test_id=OuterRef('id')).order_by('-created_at').values('status')[:1]),
            case_name=Subquery(TestCase.objects.filter(pk=OuterRef('case_id')).values('name')[:1])
        ).order_by(*ordering)


class TestyBaseSearchFilter(SearchFilter):
    def construct_orm_lookups(self, search_fields):
        return [
            self.construct_search(str(search_field))
            for search_field in search_fields
        ]

    @staticmethod
    def custom_filter(queryset, filter_conditions, request):
        return queryset.filter(filter_conditions)

    def filter_queryset(self, request, queryset, view):
        search_fields = self.get_search_fields(view, request)
        search_terms = self.get_search_terms(request)
        distinct_fields = getattr(view, 'distinct_fields', [])

        if not search_fields or not search_terms:
            return queryset

        orm_lookups = self.construct_orm_lookups(search_fields)

        base = queryset
        conditions = []
        for search_term in search_terms:
            queries = [
                models.Q(**{orm_lookup: search_term})
                for orm_lookup in orm_lookups
            ]
            conditions.append(reduce(operator.or_, queries))

        queryset = self.custom_filter(queryset, reduce(operator.and_, conditions), request)
        if not distinct_fields:
            return queryset
        if self.must_call_distinct(queryset, distinct_fields):
            # Filtering against a many-to-many field requires us to
            # call queryset.distinct() in order to avoid duplicate items
            # in the resulting queryset.
            # We try to avoid this if possible, for performance reasons.
            queryset = distinct(queryset, base)
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
            project_id=request.query_params.get('project')
        )

    def custom_filter(self, queryset, filter_conditions, request):
        valid_options = self.get_valid_options(filter_conditions, request)
        if get_boolean(request, 'is_flat'):
            return valid_options
        ancestors = self.get_ancestors(valid_options)
        lookups = form_tree_prefetch_lookups(
            self.children_field_name,
            self.children_field_name,
            self.max_level_method()
        )
        prefetch_objects = []
        for lookup in lookups:
            prefetch_objects.append(Prefetch(lookup, queryset=ancestors))
        return ancestors.filter(parent_id=request.query_params.get('parent')).prefetch_related(*prefetch_objects)


class TestSuiteSearchFilter(TreeSearchBaseFilter):
    children_field_name = 'child_test_suites'
    max_level_method = TestSuiteSelector.get_max_level
    model_class = TestSuite

    def get_ancestors(self, valid_options):
        return super().get_ancestors(valid_options).annotate(**TestSuiteSelector.cases_count_annotation())

    def custom_filter(self, queryset, filter_conditions, request):
        valid_options = self.get_valid_options(filter_conditions, request)
        if get_boolean(request, 'is_flat'):
            return valid_options
        max_level = self.max_level_method()
        ancestors = self.get_ancestors(valid_options)
        return ancestors.filter(parent_id=request.query_params.get('parent')).prefetch_related(
            *TestSuiteSelector.suites_tree_prefetch_children(max_level),
            *TestSuiteSelector.suites_tree_prefetch_cases(max_level),
        )


class TestPlanSearchFilter(TreeSearchBaseFilter):
    children_field_name = 'child_test_plans'
    max_level_method = TestPlanSelector.get_max_level
    model_class = TestPlan

    def get_ancestors(self, valid_options):
        return super().get_ancestors(valid_options).prefetch_related('parameters')

    def get_valid_options(self, filter_conditions, request):
        additional_filters = {
            'project_id': request.query_params.get('project')
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
                output_field=models.TextField()
            )
        ).filter(
            filter_conditions,
            **additional_filters
        )


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
                models.Q(**{orm_lookup: search_term})
                for orm_lookup in orm_lookups
            ]
            conditions.append(reduce(operator.or_, queries))
        queryset = queryset.filter(reduce(operator.and_, conditions))

        return queryset


class CustomOrderingFilter(OrderingFilter):

    def filter_queryset(self, request, queryset):
        ordering = request.query_params.get('ordering')
        if not ordering:
            return queryset
        ordering = list(map(str.strip, ordering.split(',')))
        return queryset.order_by(*ordering)


class CustomSearchFilter(SearchFilter):
    def filter_queryset(self, request, queryset, allowed_search_params: List[str]):
        filter_lookup = {}
        for query_param_name in allowed_search_params:
            if value := request.query_params.get(query_param_name):
                filter_lookup[f'{query_param_name}__in'] = list(map(str.strip, value.split(',')))
        return queryset.filter(**filter_lookup)


class UserFilter(filters.FilterSet):
    username = filters.CharFilter(lookup_expr='icontains')
    email = filters.CharFilter(lookup_expr='icontains')
    first_name = filters.CharFilter(lookup_expr='icontains')
    last_name = filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = UserModel
        fields = ('username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff')

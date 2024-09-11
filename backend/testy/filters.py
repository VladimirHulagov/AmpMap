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
from functools import partial, reduce
from typing import Callable

from django.contrib.auth import get_user_model
from django.db.models import Model, Prefetch, Q, QuerySet
from django_filters import BaseInFilter
from django_filters import rest_framework as filters
from rest_framework.filters import OrderingFilter, SearchFilter
from tests_representation.services.statistics import LabelProcessor

from testy.utilities.request import get_boolean
from testy.utilities.string import parse_bool_from_str, parse_int
from testy.utilities.tree import form_tree_prefetch_lookups

UserModel = get_user_model()

project_filter = partial(
    filters.NumberFilter,
    'project',
    required=True,
    error_messages={
        'required': 'Project query parameter is required',
    },
)


class ArchiveFilterMixin(filters.FilterSet):
    def filter_queryset(self, queryset):
        if not parse_bool_from_str(self.data.get('is_archive')):
            queryset = queryset.filter(is_archive=False)
        return super().filter_queryset(queryset)


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


class LabelsFilterMixin:
    def __new__(cls, *args, **kwargs):
        new_obj = super().__new__(cls)
        filter_ = BaseInFilter(method='filter_by_labels')
        new_obj.base_filters.update({'labels': filter_})
        return new_obj

    def filter_by_labels(self, queryset, field_name, label_ids: list[int]):
        filter_condition = {
            'labels': label_ids,
            'labels_condition': self.request.query_params.get('labels_condition', 'or'),
        }
        processor = LabelProcessor(filter_condition, outer_ref_prefix=None)
        return processor.process_labels(queryset)
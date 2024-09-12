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
from django_filters import rest_framework as filters
from simple_history.utils import get_history_model_for_model

from testy.filters import ArchiveFilterMixin, FlatFilterMixin, LabelsFilterMixin, TreeSearchBaseFilter, project_filter
from testy.tests_description.models import TestCase, TestSuite
from testy.tests_description.selectors.suites import TestSuiteSelector
from testy.utilities.request import get_boolean
from testy.utilities.string import parse_int


class TestCaseFilter(ArchiveFilterMixin, FlatFilterMixin, LabelsFilterMixin):
    project = project_filter()
    name = filters.CharFilter(lookup_expr='icontains')
    ordering = filters.OrderingFilter(
        fields=(
            ('id', 'id'),
            ('name', 'name'),
        ),
    )

    class Meta:
        model = TestCase
        fields = ('id', 'suite', 'name')


class TestCaseFilterSearch(ArchiveFilterMixin, LabelsFilterMixin):
    project = project_filter()
    name = filters.CharFilter(lookup_expr='icontains')


class TestCaseHistoryFilter(filters.FilterSet):
    ordering = filters.OrderingFilter(
        fields=(
            ('history_date', 'history_date'),
            ('history_user', 'history_user'),
            ('history_type', 'history_type'),
        ),
    )

    class Meta:
        model = get_history_model_for_model(TestCase)
        fields = ('id',)


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


class TestSuiteFilter(filters.FilterSet):
    project = project_filter()
    ordering = filters.OrderingFilter(
        fields=(
            ('id', 'id'),
            ('name', 'name'),
            ('descendant_count', 'descendant_count'),
            ('total_cases_count', 'total_cases_count'),
            ('total_estimates', 'total_estimates'),
        ),
    )

    class Meta:
        model = TestSuite
        fields = ('project', 'parent')
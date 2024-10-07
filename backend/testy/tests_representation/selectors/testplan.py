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

import logging
from typing import Any, Iterable

from django.db.models import OuterRef, Q, QuerySet
from mptt.querysets import TreeQuerySet

from testy.root.selectors import MPTTSelector
from testy.tests_representation.models import Parameter, Test, TestPlan
from testy.tests_representation.selectors.results import TestResultSelector
from testy.tests_representation.services.statistics import HistogramProcessor, LabelProcessor, PieChartProcessor
from testy.utilities.request import PeriodDateTime
from testy.utilities.sql import SubCount
from testy.utilities.string import parse_bool_from_str
from testy.utilities.tree import form_tree_prefetch_lookups, form_tree_prefetch_objects, get_breadcrumbs_treeview

logger = logging.getLogger(__name__)

_CHILD_TEST_PLANS = 'child_test_plans'
_PARAMETERS = 'parameters'
_STATUS = 'status'
_ESTIMATES = 'estimates'
_EMPTY_ESTIMATES = 'empty_estimates'
_NAME = 'name'
_ID = 'id'
_COLOR = 'color'
_VALUE = 'value'


class TestPlanSelector:  # noqa: WPS214
    def get_max_level(self) -> int:
        return MPTTSelector.model_max_level(TestPlan)

    @classmethod
    def testplan_list_raw(cls) -> QuerySet[TestPlan]:
        return TestPlan.objects.all()

    def testplan_list(self, is_archive: bool = False) -> QuerySet[TestPlan]:
        max_level = self.get_max_level()
        testplan_prefetch_objects = form_tree_prefetch_objects(
            nested_prefetch_field=_CHILD_TEST_PLANS,
            prefetch_field=_CHILD_TEST_PLANS,
            tree_depth=max_level,
            queryset_class=TestPlan,
            queryset_filter=None if is_archive else {'is_archive': False},
        )
        testplan_prefetch_objects.extend(
            form_tree_prefetch_objects(
                nested_prefetch_field=_CHILD_TEST_PLANS,
                prefetch_field=_PARAMETERS,
                tree_depth=max_level,
                queryset_class=Parameter,
            ),
        )
        return TestPlan.objects.all().prefetch_related(
            *testplan_prefetch_objects,
        )

    def testplan_deleted_list(self):
        max_level = self.get_max_level()
        return TestPlan.deleted_objects.all().prefetch_related(
            *form_tree_prefetch_objects(
                nested_prefetch_field=_CHILD_TEST_PLANS,
                prefetch_field=_CHILD_TEST_PLANS,
                tree_depth=max_level,
                queryset_class=TestPlan,
                manager_name='deleted_objects',
            ),
            *form_tree_prefetch_lookups(_CHILD_TEST_PLANS, _PARAMETERS, max_level),
        )

    def testplan_project_root_list(self, project_id: int) -> QuerySet[TestPlan]:
        return TestPlan.objects.filter(project=project_id, parent=None).order_by(_NAME)

    def testplan_get_by_pk(self, pk) -> TestPlan | None:
        return TestPlan.objects.get(pk=pk)

    @classmethod
    def testplan_breadcrumbs_by_ids(cls, ids: list[int]) -> dict[str, dict[str, Any]]:
        plans = TestPlan.objects.filter(pk__in=ids).prefetch_related(_PARAMETERS)
        ancestors = plans.get_ancestors(include_self=False).prefetch_related(_PARAMETERS).order_by('lft')
        ids_to_breadcrumbs = {}
        for plan in plans:
            tree = [ancestor for ancestor in ancestors if ancestor.is_ancestor_of(plan)]
            tree.append(plan)
            ids_to_breadcrumbs[plan.id] = get_breadcrumbs_treeview(
                instances=tree,
                depth=len(tree) - 1,
                title_method=cls._get_testplan_title,
            )
        return ids_to_breadcrumbs

    def testplan_treeview_list(self, qs: QuerySet[TestPlan], parent_id: int = None) -> QuerySet[TestPlan]:
        max_level = self.get_max_level()
        testplan_prefetch_objects = form_tree_prefetch_objects(
            nested_prefetch_field=_CHILD_TEST_PLANS,
            prefetch_field=_CHILD_TEST_PLANS,
            tree_depth=max_level,
            queryset=qs,
        )
        testplan_prefetch_objects.extend(
            form_tree_prefetch_objects(
                nested_prefetch_field=_CHILD_TEST_PLANS,
                prefetch_field=_PARAMETERS,
                tree_depth=max_level,
                queryset_class=Parameter,
            ),
        )
        return TestPlan.objects.filter(parent=parent_id).order_by('-created_at').prefetch_related(
            *testplan_prefetch_objects,
        )

    @classmethod
    def testplan_list_ancestors(cls, instance: TestPlan) -> TreeQuerySet[TestPlan]:
        return instance.get_ancestors(include_self=True).prefetch_related(_PARAMETERS)

    @classmethod
    def testplan_list_descendants(cls, instance: TestPlan) -> TreeQuerySet[TestPlan]:
        return instance.get_descendants(include_self=True).prefetch_related(_PARAMETERS)

    @classmethod
    def get_testplan_descendants_ids_by_testplan(cls, test_plan: TestPlan, include_self: bool = True):
        return test_plan.get_descendants(include_self=include_self).values_list('pk', flat=True)

    def testplan_statistics(
        self,
        test_plan: TestPlan,
        parameters: dict[str, Any],
        is_archive: bool = False,
    ):
        label_processor = LabelProcessor(parameters)
        pie_chart_processor = PieChartProcessor(parameters)
        root_only = parse_bool_from_str(parameters.get('root_only', None))
        if root_only:
            test_plan_child_ids = [test_plan.pk]
        else:
            test_plan_child_ids = self.get_testplan_descendants_ids_by_testplan(test_plan)

        is_archive_condition = Q() if is_archive else Q(is_archive=False)
        tests = Test.objects.filter(
            is_archive_condition,
            plan_id__in=test_plan_child_ids,
            is_deleted=False,
        )

        if label_processor.labels or label_processor.not_labels:
            tests = label_processor.process_labels(tests)
        return pie_chart_processor.process_statistic(tests, test_plan.project)

    def get_plan_progress(self, plan_id: int, period: PeriodDateTime):
        last_status_period = TestResultSelector.get_last_status_subquery(
            filters=[Q(created_at__gte=period.start) & Q(created_at__lte=period.end)],
        )
        last_status_total = TestResultSelector.get_last_status_subquery()
        descendants_include_self_lookup = Q(
            plan__lft__gte=OuterRef('lft'),
            plan__rght__lte=OuterRef('rght'),
            plan__tree_id=OuterRef('tree_id'),
            plan__is_archive=False,
        )
        tests_total_query = Test.objects.filter(descendants_include_self_lookup).values('pk')
        tests_progress_period = self._get_tests_subquery(last_status_period, descendants_include_self_lookup)
        tests_progress_total = self._get_tests_subquery(last_status_total, descendants_include_self_lookup)
        return (
            TestPlan.objects
            .filter(parent=plan_id, is_archive=False)
            .prefetch_related(_PARAMETERS)
            .annotate(
                tests_total=SubCount(tests_total_query),
                tests_progress_period=SubCount(tests_progress_period),
                tests_progress_total=SubCount(tests_progress_total),
            )
        )

    def testplan_histogram(
        self,
        test_plan: TestPlan,
        parameters: dict[str, Any],
        is_archive: bool = False,
    ):
        histogram_processor = HistogramProcessor(parameters)
        label_processor = LabelProcessor(parameters, 'test__case')
        root_only = parse_bool_from_str(parameters.get('root_only', None))
        if root_only:
            test_plan_child_ids = [test_plan.pk]
        else:
            test_plan_child_ids = self.get_testplan_descendants_ids_by_testplan(test_plan)
        is_archive_condition = {} if is_archive else {'is_archive': False}
        test_results = (
            TestResultSelector()
            .result_by_test_plan_ids(test_plan_child_ids, is_archive_condition)
        )
        if label_processor.labels or label_processor.not_labels:
            test_results = label_processor.process_labels(test_results)

        return histogram_processor.process_statistic(test_results, test_plan.project)

    @classmethod
    def plan_list_by_ids(cls, ids: Iterable[int]) -> QuerySet[TestPlan]:
        return TestPlan.objects.filter(id__in=ids)

    @classmethod
    def _get_tests_subquery(cls, last_status_subquery, descendants_lookup):
        return Test.objects.annotate(last_status=last_status_subquery).filter(
            descendants_lookup,
            last_status__isnull=False,
        ).values('pk')

    @classmethod
    def _get_testplan_title(cls, instance: TestPlan):
        if parameters := instance.parameters.all():
            return '{0} [{1}]'.format(instance.name, ', '.join([parameter.data for parameter in parameters]))
        return instance.name

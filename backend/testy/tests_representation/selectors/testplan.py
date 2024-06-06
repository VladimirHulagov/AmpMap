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

import logging
from typing import Any, Dict, Iterable, List, Optional

from django.db.models import Case, Count, DateTimeField, F, FloatField, OuterRef, Q, QuerySet, Sum, When, expressions
from django.db.models.functions import Cast, Coalesce
from mptt.querysets import TreeQuerySet

from testy.root.selectors import MPTTSelector
from testy.tests_representation.choices import TestStatuses
from testy.tests_representation.models import Parameter, Test, TestPlan
from testy.tests_representation.selectors.results import TestResultSelector
from testy.tests_representation.services.statistics import HistogramProcessor, StatisticProcessor
from testy.utilities.request import PeriodDateTime
from testy.utilities.sql import DateTrunc, SubCount
from testy.utilities.time import Period
from testy.utilities.tree import form_tree_prefetch_lookups, form_tree_prefetch_objects, get_breadcrumbs_treeview

logger = logging.getLogger(__name__)

_CHILD_TEST_PLANS = 'child_test_plans'
_PARAMETERS = 'parameters'
_STATUS = 'status'
_ESTIMATES = 'estimates'
_EMPTY_ESTIMATES = 'empty_estimates'


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
        return TestPlan.objects.filter(project=project_id, parent=None).order_by('name')

    def testplan_get_by_pk(self, pk) -> Optional[TestPlan]:
        return TestPlan.objects.get(pk=pk)

    @classmethod
    def testplan_breadcrumbs_by_ids(cls, ids: List[int]) -> Dict[str, Dict[str, Any]]:
        plans = TestPlan.objects.filter(pk__in=ids).prefetch_related(_PARAMETERS)
        ancestors = plans.get_ancestors(include_self=False).prefetch_related(_PARAMETERS)
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

    def testplan_treeview_list(
        self,
        is_archive: bool = False,
        children_ordering: str = None,
        parent_id: int = None,
    ) -> QuerySet[TestPlan]:
        max_level = self.get_max_level()
        children_ordering = children_ordering.split(',') if children_ordering else ['-started_at']
        testplan_prefetch_objects = form_tree_prefetch_objects(
            nested_prefetch_field=_CHILD_TEST_PLANS,
            prefetch_field=_CHILD_TEST_PLANS,
            tree_depth=max_level,
            queryset_class=TestPlan,
            queryset_filter=None if is_archive else {'is_archive': False},
            order_by_fields=children_ordering,
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
        filter_condition: Dict[str, Any],
        estimate_period: Optional[str] = None,
        is_archive: bool = False,
    ):
        test_plan_child_ids = tuple(self.get_testplan_descendants_ids_by_testplan(test_plan))
        seconds = Period.MINUTE.in_seconds(in_workday=True)
        if estimate_period:
            estimate_period = next(
                (period for period in Period.list_of_workday() if period.name.lower() in estimate_period.lower()),
                Period.SECOND,
            )
            seconds = estimate_period.in_seconds(in_workday=True)
        is_archive_condition = Q() if is_archive else Q(is_archive=False)
        latest_status = TestResultSelector.get_last_status_subquery()
        total_estimate = Sum(
            Cast(F('case__estimate'), FloatField()) / seconds,
            output_field=FloatField(),
        )
        tests = Test.objects.filter(
            is_archive_condition,
            plan_id__in=test_plan_child_ids,
            is_deleted=False,
        ).annotate(
            status=Coalesce(latest_status, TestStatuses.UNTESTED),
            estimates=Coalesce(total_estimate, 0, output_field=FloatField()),
            is_empty_estimate=Case(
                When(Q(case__estimate__isnull=True), then=1),
                default=0,
            ),
            empty_estimates=Sum('is_empty_estimate'),
        )
        statistic_processor = StatisticProcessor(filter_condition)
        if statistic_processor.labels or statistic_processor.not_labels:
            tests = statistic_processor.process_labels(tests)

        rows = tests.values(
            _STATUS, _ESTIMATES, _EMPTY_ESTIMATES,
        ).annotate(
            count=Count('id', distinct=True),
        ).order_by(_STATUS)

        result = []
        presented_statuses = [row[_STATUS] for row in rows]
        for status in TestStatuses:
            if status.value in presented_statuses:
                continue
            result.append(
                {
                    'label': status.label.upper(),
                    'value': 0,
                    _ESTIMATES: 0,
                    _EMPTY_ESTIMATES: 0,
                },
            )

        for row in rows:
            result.append(
                {
                    'label': TestStatuses(row[_STATUS]).name,
                    'value': row['count'],
                    'estimates': round(row[_ESTIMATES], 2),
                    'empty_estimates': row[_EMPTY_ESTIMATES],
                },
            )
        return sorted(result, key=lambda elem: elem['value'], reverse=True)

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
        processor: HistogramProcessor,
        filter_condition: Dict[str, Any],
        is_archive: bool = False,
    ):
        test_plan_child_ids = tuple(self.get_testplan_descendants_ids_by_testplan(test_plan))
        annotate_condition = {}
        filters = {
            'created_at__range': processor.period,
        }
        if not is_archive:
            filters['is_archive'] = False
        if processor.attribute:
            order_condition = expressions.RawSQL(
                'attributes->>%s', (processor.attribute,),
            )
            values_list = (f'attributes__{processor.attribute}', _STATUS)
            filters['attributes__has_key'] = processor.attribute

        else:
            annotate_condition = {
                'period_day': DateTrunc(
                    'day',
                    'created_at',
                    output_field=DateTimeField(),
                ),
            }
            order_condition = 'period_day'
            values_list = ('period_day', _STATUS)

        test_results = (
            TestResultSelector()
            .result_by_test_plan_ids(test_plan_child_ids, filters)
            .annotate(**annotate_condition)
        )
        statistic_processor = StatisticProcessor(filter_condition, 'test__case')
        if statistic_processor.labels or statistic_processor.not_labels:
            test_results = statistic_processor.process_labels(test_results)

        test_results_formatted = (
            test_results.values(*values_list).distinct()
            .annotate(status_count=Count(_STATUS))
            .order_by(order_condition)
        )

        return processor.process_statistic(test_results_formatted)

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

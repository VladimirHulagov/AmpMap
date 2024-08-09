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
from typing import Any

from django.conf import settings
from django.contrib.postgres.aggregates import StringAgg
from django.db.models import CharField, F, OuterRef, Q, QuerySet, Subquery

from testy.tests_description.models import TestSuite
from testy.tests_representation.models import Test
from testy.tests_representation.selectors.results import TestResultSelector


class TestSelector:
    @classmethod
    def test_list(cls) -> QuerySet[Test]:
        return Test.objects.select_related('case').prefetch_related('results').annotate(
            test_suite_description=F('case__suite__description'),
        ).all()

    @classmethod
    def test_list_by_testplan_ids(cls, plan_ids: list[int]) -> QuerySet[Test]:
        return Test.objects.filter(plan__in=plan_ids)

    def test_list_with_last_status(self, filter_condition: dict[str, Any] | None = None) -> QuerySet[Test]:
        if not filter_condition:
            filter_condition = {}
        subquery = (
            TestSuite.objects
            .filter(
                Q(
                    lft__lte=OuterRef('case__suite__lft'),
                    rght__gte=OuterRef('case__suite__rght'),
                    tree_id=OuterRef('case__suite__tree_id'),
                ),
            )
            .values('tree_id')
            .annotate(concatenated_name=StringAgg('name', delimiter='/', ordering='id'))
            .values('concatenated_name')
        )
        return (
            Test.objects
            .select_related('case')
            .prefetch_related('case__suite', 'case__labeled_items', 'case__labeled_items__label', 'assignee')
            .filter(**filter_condition)
            .annotate(
                last_status=TestResultSelector.get_last_status_subquery(),
                suite_path=Subquery(
                    subquery,
                    output_field=CharField(max_length=settings.CHAR_FIELD_MAX_LEN),
                ),
                test_suite_description=F('case__suite__description'),
                estimate=F('case__estimate'),
            )
            .order_by('case__suite', '-id')
        )

    @classmethod
    def test_list_for_bulk_operation(
        cls,
        queryset: QuerySet[Test],
        included_tests: list[Test] | None,
        excluded_tests: list[Test] | None,
    ) -> QuerySet[Test]:
        if included_tests:
            queryset = queryset.filter(pk__in=[test.pk for test in included_tests])
        if excluded_tests:
            queryset = queryset.exclude(pk__in=[test.pk for test in excluded_tests])
        return queryset

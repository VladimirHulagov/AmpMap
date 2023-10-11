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
from typing import List

from django.contrib.postgres.aggregates import StringAgg
from django.db import models
from django.db.models import OuterRef, Q, QuerySet, Subquery
from tests_description.models import TestSuite
from tests_representation.models import Test, TestResult


class TestSelector:
    def test_list(self) -> QuerySet[Test]:
        return Test.objects.select_related('case').prefetch_related('results').all()

    @staticmethod
    def test_list_by_testplan_ids(plan_ids: List[int]) -> QuerySet[Test]:
        return Test.objects.filter(plan__in=plan_ids)

    def test_list_with_last_status(self) -> QuerySet[Test]:
        subquery = (
            TestSuite.objects
            .filter(
                Q(
                    lft__lt=OuterRef('case__suite__lft'),
                    rght__gt=OuterRef('case__suite__rght'),
                    tree_id=OuterRef('case__suite__tree_id')
                ) | Q(id=OuterRef('case__suite__id'))
            )
            .values('tree_id')
            .annotate(concatenated_name=StringAgg('name', delimiter='/'))
            .values('concatenated_name')
        )
        return (
            Test.objects
            .select_related('case')
            .prefetch_related('case__suite', 'case__labeled_items', 'case__labeled_items__label', 'assignee')
            .all()
            .annotate(
                last_status=Subquery(
                    TestResult.objects.filter(test_id=OuterRef("id")).order_by("-created_at").values('status')[:1]
                ),
                suite_path=Subquery(
                    subquery,
                    output_field=models.CharField(max_length=255)
                ),
            )
            .order_by('case__suite')
        )

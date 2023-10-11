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

from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from tests_description.models import TestCase, TestCaseStep
from tests_representation.models import TestPlan
from tests_representation.selectors.tests import TestSelector


class TestCaseSelector:
    def case_list(self) -> QuerySet[TestCase]:
        return TestCase.objects.all().prefetch_related(
            'attachments', 'steps', 'steps__attachments', 'labeled_items', 'labeled_items__label',
        )

    def case_deleted_list(self):
        return TestCase.deleted_objects.all().prefetch_related()

    def case_version(self, case: TestCase) -> int:
        history = case.history.first()
        return history.history_id

    def get_steps_ids_by_testcase(self, case: TestCase) -> List[int]:
        return case.steps.values_list('id', flat=True)

    @staticmethod
    def case_ids_by_testplan_id(plan_id: int, include_children: bool) -> List[int]:
        if not include_children:
            return TestSelector.test_list_by_testplan_ids([plan_id]).values_list('case__id', flat=True)
        plan_ids = (
            get_object_or_404(TestPlan, pk=plan_id)
            .get_descendants(include_self=True)
            .values_list('pk', flat=True)
        )
        return TestSelector.test_list_by_testplan_ids(plan_ids).values_list('case__id', flat=True)

    @classmethod
    def cases_by_ids_list(cls, ids: List[int], field_name: str) -> QuerySet[TestCase]:
        return TestCase.objects.filter(**{f'{field_name}__in': ids}).order_by('id')


class TestCaseStepSelector:
    def step_exists(self, step_id) -> bool:
        return TestCaseStep.objects.filter(id=step_id).exists()

    @classmethod
    def steps_by_ids_list(cls, ids: List[int], field_name: str) -> QuerySet[TestCaseStep]:
        return TestCaseStep.objects.filter(**{f'{field_name}__in': ids}).order_by('id')

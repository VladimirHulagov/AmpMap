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

from typing import Any, Dict, List, Optional, Tuple

from core.selectors.attachments import AttachmentSelector
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import OuterRef, QuerySet, Subquery
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from tests_description.models import TestCase, TestCaseStep
from tests_representation.models import TestPlan
from tests_representation.selectors.tests import TestSelector


class TestCaseSelector:
    def case_list(self, filter_condition: Optional[Dict[str, Any]] = None) -> QuerySet[TestCase]:
        if not filter_condition:
            filter_condition = {}
        return TestCase.objects.filter(**filter_condition).prefetch_related(
            'attachments', 'steps', 'steps__attachments', 'labeled_items', 'labeled_items__label',
        ).annotate(
            current_version=self._current_version_subquery(),
            versions=self._versions_subquery(),
        )

    def case_deleted_list(self):
        return TestCase.deleted_objects.all().prefetch_related().annotate(
            current_version=self._current_version_subquery(),
            versions=self._versions_subquery(),
        )

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

    @classmethod
    def case_by_version(cls, pk: str, version: Optional[str]) -> Tuple[TestCase, Optional[str]]:
        instance = get_object_or_404(TestCase, pk=pk)

        if not version:
            return instance, None

        if not version.isnumeric():
            raise ValidationError('Version must be a valid integer.')

        history_instance = get_object_or_404(instance.history, history_id=version)
        return history_instance.instance, version

    @classmethod
    def _current_version_subquery(cls):
        return (
            TestCase.history
            .filter(id=OuterRef('id'))
            .order_by('-history_id')
            .values_list('history_id', flat=True)[:1]
        )

    @classmethod
    def _versions_subquery(cls):
        return Subquery(
            TestCase.history
            .filter(id=OuterRef('id'))
            .values('id')
            .annotate(temp=ArrayAgg('history_id', ordering='-history_id'))
            .values('temp')
        )

    @classmethod
    def get_history_by_case_id(cls, pk: int):
        return TestCase.history.select_related('history_user').filter(id=pk).order_by('-history_id')

    @classmethod
    def get_case_history_by_version(cls, pk: int, version: int):
        return TestCase.history.select_related('history_user').filter(id=pk, history_id=version).first()

    @classmethod
    def get_latest_version_by_id(cls, pk: int):
        return TestCase.history.filter(id=pk).latest().history_id

    @classmethod
    def version_exists(cls, pk: int, version: int):
        return TestCase.history.filter(id=pk, history_id=version).exists()

    @classmethod
    def get_last_history(cls, pk: int):
        return TestCase.history.filter(id=pk).latest()


class TestCaseStepSelector:
    def step_exists(self, step_id) -> bool:
        return TestCaseStep.objects.filter(id=step_id).exists()

    @classmethod
    def steps_by_ids_list(cls, ids: List[int], field_name: str) -> QuerySet[TestCaseStep]:
        return TestCaseStep.objects.filter(**{f'{field_name}__in': ids}).order_by('id')

    @classmethod
    def get_steps_by_case_version_id(cls, version: int):
        return TestCaseStep.history.filter(test_case_history_id=version, is_deleted=False).as_instances()

    @classmethod
    def get_latest_version_by_id(cls, pk: int):
        return TestCaseStep.history.filter(id=pk).latest().history_id

    @classmethod
    def get_attachments_by_case_version(cls, step: TestCaseStep, version: int):
        step_versions = list(
            TestCaseStep.history
            .filter(id=step.pk, test_case_history_id=version)
            .values_list('history_id', flat=True)
        )
        old_attachments = AttachmentSelector.attachment_list_by_parent_object_and_history_ids(
            step, step.id, step_versions
        )
        return old_attachments

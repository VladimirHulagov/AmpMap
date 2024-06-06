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
from typing import Any, Dict, List, Optional, Tuple

from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import OuterRef, Q, QuerySet, Subquery
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from testy.core.selectors.attachments import AttachmentSelector
from testy.tests_description.models import TestCase, TestCaseStep
from testy.tests_representation.models import TestPlan, TestStepResult
from testy.tests_representation.selectors.tests import TestSelector

logger = logging.getLogger(__name__)


_ID = 'id'


class TestCaseSelector:  # noqa: WPS214
    def case_list(self, filter_condition: Optional[Dict[str, Any]] = None) -> QuerySet[TestCase]:
        if not filter_condition:
            filter_condition = {}
        return TestCase.objects.filter(**filter_condition).prefetch_related(
            'attachments', 'steps', 'steps__attachments', 'labeled_items', 'labeled_items__label',
        ).annotate(
            current_version=self._current_version_subquery(),
            versions=self._versions_subquery(),
        ).order_by()

    def case_list_with_label_names(self, filter_condition: Optional[Dict[str, Any]] = None) -> QuerySet[TestCase]:
        return self.case_list(filter_condition=filter_condition).annotate(
            labels=ArrayAgg('labeled_items__label__name', distinct=True, filter=Q(labeled_items__is_deleted=False)),
            label_ids=ArrayAgg('labeled_items__label__id', distinct=True, filter=Q(labeled_items__is_deleted=False)),
        )

    @classmethod
    def case_by_id(cls, case_id: int) -> TestCase:
        return get_object_or_404(TestCase, pk=case_id)

    def case_deleted_list(self):
        return TestCase.deleted_objects.all().prefetch_related().annotate(
            current_version=self._current_version_subquery(),
            versions=self._versions_subquery(),
        )

    def case_version(self, case: TestCase) -> int:
        history = case.history.first()
        return history.history_id

    def get_steps_ids_by_testcase(self, case: TestCase) -> List[int]:
        return case.steps.values_list(_ID, flat=True)

    @classmethod
    def case_ids_by_testplan_id(cls, plan_id: int, include_children: bool) -> List[int]:
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
        return TestCase.objects.filter(**{f'{field_name}__in': ids}).order_by(_ID)

    @classmethod
    def case_by_version(cls, case: TestCase, version: Optional[str]) -> Tuple[TestCase, Optional[str]]:
        if not version:
            return case, None

        if not version.isnumeric():
            raise ValidationError('Version must be a valid integer.')

        history_instance = get_object_or_404(case.history, history_id=version)
        return history_instance.instance, version

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

    @classmethod
    def _current_version_subquery(cls):
        return (
            TestCase.history
            .filter(id=OuterRef(_ID))
            .order_by('-history_id')
            .values_list('history_id', flat=True)[:1]
        )

    @classmethod
    def _versions_subquery(cls):
        return Subquery(
            TestCase.history
            .filter(id=OuterRef(_ID))
            .values(_ID)
            .annotate(temp=ArrayAgg('history_id', ordering='-history_id'))
            .values('temp'),
        )


class TestCaseStepSelector:
    def step_exists(self, step_id) -> bool:
        return TestCaseStep.objects.filter(id=step_id).exists()

    @classmethod
    def steps_by_ids_list(cls, ids: List[int], field_name: str) -> QuerySet[TestCaseStep]:
        return TestCaseStep.objects.filter(**{f'{field_name}__in': ids}).order_by(_ID)

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
            .values_list('history_id', flat=True),
        )
        return AttachmentSelector.attachment_list_by_parent_object_and_history_ids(
            type(step), step.id, step_versions,
        )

    @classmethod
    def get_step_by_step_result(cls, step_result: TestStepResult) -> Optional[TestCaseStep]:
        test_case_history_id = step_result.test_result.test_case_version
        step = step_result.step
        steps = step.history.filter(test_case_history_id=test_case_history_id)
        # TODO: research and fix the problem creating double historical records may be a plugin issue
        if len(steps) > 1:
            logger.warning(
                f'case step {step.id} has one more history records with same case history id {test_case_history_id}',
            )
        return steps.first()

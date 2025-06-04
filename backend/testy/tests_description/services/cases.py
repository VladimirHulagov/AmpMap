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
from logging import getLogger
from typing import Any

from django.db import transaction
from django.db.models import QuerySet
from simple_history.utils import bulk_update_with_history

from testy.core.choices import LabelsActionChoices
from testy.core.models import Project
from testy.core.services.attachments import AttachmentService
from testy.core.services.labels import LabelService
from testy.tests_description.models import TestCase, TestCaseStep
from testy.tests_description.selectors.cases import TestCaseSelector, TestCaseStepSelector
from testy.tests_description.signals import pre_create_case
from testy.users.models import User

_ATTACHMENTS = 'attachments'
_USER = 'user'
_ID = 'id'
_SKIP_HISTORY = 'skip_history'
_TEST_CASE_HISTORY_ID = 'test_case_history_id'
_PROJECT = 'project'

logger = getLogger(__name__)


class TestCaseService:
    non_side_effect_fields = ['name', _PROJECT, 'scenario', 'expected']

    case_non_side_effect_fields = [
        'suite', 'setup', 'teardown', 'estimate', 'description', 'is_steps', 'attributes',
        *non_side_effect_fields,
    ]
    step_non_side_effect_fields = [
        'sort_order', 'test_case', _TEST_CASE_HISTORY_ID,
        *non_side_effect_fields,
    ]

    @classmethod
    def step_create(cls, data: dict[str, Any]) -> TestCaseStep:
        step: TestCaseStep = TestCaseStep.model_create(
            fields=cls.step_non_side_effect_fields,
            data=data,
        )
        latest_history_id = TestCaseStepSelector.get_latest_version_by_id(step.id)
        for attachment in data.get(_ATTACHMENTS, []):
            AttachmentService().attachment_set_content_object(attachment, step)
            AttachmentService().add_history_to_attachment(attachment, latest_history_id)

        return step

    @classmethod
    def step_update(
        cls,
        step: TestCaseStep,
        data: dict[str, Any],
    ) -> TestCaseStep:
        skip_history = data.pop(_SKIP_HISTORY, False)
        step, _ = step.model_update(
            fields=cls.step_non_side_effect_fields,
            data=data,
            skip_history=skip_history,
            force=True,
        )

        attachments = data.get(_ATTACHMENTS, [])
        AttachmentService().attachments_update_content_object(attachments, step)
        AttachmentService().bulk_add_history_to_attachment(
            attachments, step.history.latest().history_id,
        )
        return step

    @classmethod
    @transaction.atomic
    def case_with_steps_create(cls, data: dict[str, Any]) -> TestCase:
        case = cls.case_create(data)

        for step in data.pop('steps', []):
            step['test_case'] = case
            step[_PROJECT] = case.project
            step[_TEST_CASE_HISTORY_ID] = case.history.first().history_id
            cls.step_create(step)

        return case

    @classmethod
    @transaction.atomic
    def case_create(cls, data: dict[str, Any]) -> TestCase:
        pre_create_case.send(sender=cls.case_create, data=data)
        user = data.pop(_USER)
        case: TestCase = TestCase.model_create(
            fields=cls.case_non_side_effect_fields,
            data=data,
        )

        latest_history_id = TestCaseSelector.get_latest_version_by_id(case.id)
        for attachment in data.get(_ATTACHMENTS, []):
            AttachmentService().attachment_set_content_object(attachment, case)
            AttachmentService().add_history_to_attachment(attachment, latest_history_id)

        LabelService().set(data.get('labels', []), case, user)

        return case

    @classmethod
    @transaction.atomic
    def case_with_steps_update(cls, case: TestCase, data: dict[str, Any]) -> TestCase:
        case_steps = data.pop('steps', [])
        case = cls.case_update(case, data)
        steps_id_pool: list[int] = []

        for step in case_steps:
            if _ID in step.keys():
                if TestCaseStepSelector().step_exists(step[_ID]):
                    step_instance = TestCaseStep.objects.get(id=step[_ID])

                    step_instance = cls.step_update(
                        step=step_instance,
                        data={
                            _TEST_CASE_HISTORY_ID: case.history.first().history_id,
                            _SKIP_HISTORY: data.get(_SKIP_HISTORY),
                            **step,
                        },
                    )
                    steps_id_pool.append(step_instance.id)
                else:
                    # TODO: add logging
                    continue
            else:
                step['test_case'] = case
                step[_PROJECT] = case.project
                step[_TEST_CASE_HISTORY_ID] = case.history.first().history_id
                step_instance = cls.step_create(step)
                steps_id_pool.append(step_instance.id)

        for step_id in TestCaseSelector().get_steps_ids_by_testcase(case):
            if step_id not in steps_id_pool:
                TestCaseStep.objects.filter(test_case=case).update(test_case_history_id=case.history.first().history_id)
                TestCaseStep.objects.filter(pk=step_id).delete()

        return case

    @classmethod
    @transaction.atomic
    def case_update(cls, case: TestCase, data: dict[str, Any]) -> TestCase:
        user = data.pop(_USER)
        skip_history = data.get(_SKIP_HISTORY, False)
        case, _ = case.model_update(
            fields=cls.case_non_side_effect_fields,
            data=data,
            force=True,
            skip_history=skip_history,
        )

        if not case.is_steps:
            TestCaseStep.objects.filter(test_case=case).update(test_case_history_id=case.history.first().history_id)
            TestCaseStep.objects.filter(test_case=case).delete()

        attachments = data.get(_ATTACHMENTS, [])
        latest_history_id = TestCaseSelector.get_latest_version_by_id(case.id)

        AttachmentService().attachments_update_content_object(attachments, case)
        AttachmentService().bulk_add_history_to_attachment(attachments, latest_history_id)

        LabelService().set(data.get('labels', []), case, user)

        return case

    @classmethod
    def restore_test_case_steps_versions(cls, history_case):
        current_steps_id = {step.id for step in history_case.instance.steps.all()}
        old_steps_id = {
            step.id for step in  # noqa: WPS361
            TestCaseStepSelector.get_steps_by_case_version_id(history_case.history_id)
        }

        delete_ids = current_steps_id - old_steps_id
        latest_case_history_id = TestCaseSelector.get_latest_version_by_id(history_case.id)

        for step in TestCaseStepSelector.steps_by_ids_list(delete_ids, field_name='pk'):
            step.test_case_history_id = latest_case_history_id
            step.delete(commit=False)
            step.save()

        for instance_id in old_steps_id:
            historical_step = (
                TestCaseStepSelector
                .get_steps_by_case_version_id(history_case.history_id)
                .filter(pk=instance_id)
            )
            if len(historical_step) > 1:
                logger.warning(f'Found duplicate historical step for step with id: {instance_id}')
            historical_step = historical_step.first()  # workaround for duplicate history ids, plugin may be an issue
            historical_step.test_case_history_id = latest_case_history_id
            historical_step.restore(commit=False)
            historical_step.save()
            step_history = historical_step.history.filter(test_case_history_id=history_case.history_id).first()
            AttachmentService().restore_by_version(historical_step, step_history.history_id)

    @classmethod
    @transaction.atomic
    def restore_version(cls, version: int, pk: int) -> TestCase:
        history = TestCaseSelector.get_case_history_by_version(pk, version)
        history.instance.save()
        LabelService.restore_by_version(history.instance, version)
        AttachmentService().restore_by_version(history.instance, version)
        cls.restore_test_case_steps_versions(history)
        return history.instance

    @classmethod
    @transaction.atomic
    def bulk_update_cases(
        cls,
        queryset: QuerySet[TestCase],
        payload: dict[str, Any],
        user: User,
    ) -> QuerySet[TestCase]:
        project = payload[_PROJECT]
        test_cases = TestCaseSelector.list_for_bulk_operation(
            queryset=queryset,
            included_objects=payload.pop('included_cases', None),
            excluded_objects=payload.pop('excluded_cases', None),
        )
        labels = payload.pop('labels', None)
        labels_action = payload.pop('labels_action', None)
        if labels is not None:
            cls._process_labels(test_cases, labels, labels_action, project, user)

        for test_case in test_cases:
            for field_name, field_value in payload.items():
                setattr(test_case, field_name, field_value)

        bulk_update_with_history(
            test_cases,
            model=TestCase,
            fields=payload.keys(),
            default_user=user,
            default_change_reason='Bulk update test cases',
        )
        return TestCaseSelector().case_list({'pk__in': [case.pk for case in test_cases]})

    @classmethod
    def _process_labels(
        cls,
        test_cases: QuerySet[TestCase],
        labels: list[dict[str, Any]],
        labels_action: str,
        project: Project,
        user: User,
    ) -> None:
        match labels_action:
            case LabelsActionChoices.ADD.value:
                LabelService.bulk_add(
                    labels=labels,
                    content_objects=list(test_cases),
                    content_model=TestCase,
                    project=project,
                    user=user,
                )
            case LabelsActionChoices.UPDATE.value | LabelsActionChoices.CLEAR.value:
                LabelService.bulk_set(
                    labels=labels,
                    content_objects=list(test_cases),
                    content_model=TestCase,
                    project=project,
                    user=user,
                )
            case LabelsActionChoices.DELETE.value:
                LabelService.bulk_delete(
                    labels=labels,
                    content_model=TestCase,
                    content_objects=list(test_cases),
                    user=user,
                )
            case _:
                return

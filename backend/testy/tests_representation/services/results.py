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

from channels.layers import get_channel_layer
from django.db import transaction
from simple_history.utils import bulk_create_with_history, bulk_update_with_history

from testy.core.selectors.attachments import AttachmentSelector
from testy.core.services.attachments import AttachmentService
from testy.tests_description.selectors.cases import TestCaseSelector, TestCaseStepSelector
from testy.tests_representation.models import Test, TestResult, TestStepResult
from testy.tests_representation.signals import pre_create_result
from testy.tests_representation.validators import TestResultCustomAttributeValuesValidator
from testy.users.models import User

_STATUS = 'status'
_BATCH_SIZE = 500

channel_layer = get_channel_layer()
logger = logging.getLogger(__name__)


class TestResultService:
    non_side_effect_fields = [
        _STATUS, 'user', 'test', 'comment', 'is_archive', 'test_case_version', 'execution_time', 'attributes',
    ]

    step_non_side_effect_fields = ['test_result', 'step', _STATUS, 'project']

    @transaction.atomic
    def result_create(self, data: dict[str, Any], user: User) -> TestResult:
        pre_create_result.send(sender=self.result_create, data=data)
        test_result: TestResult = TestResult.model_create(
            fields=self.non_side_effect_fields,
            data=data,
            commit=False,
        )
        test_result.user = user
        test_result.project = test_result.test.case.project
        test_result.test_case_version = TestCaseSelector().case_version(test_result.test.case)
        test_result.full_clean()
        test_result.save()

        for attachment in data.get('attachments', []):
            AttachmentService().attachment_set_content_object(attachment, test_result)

        for steps_results in data.get('steps_results', []):
            steps_results['test_result'] = test_result
            steps_results['project'] = test_result.project
            TestStepResult.model_create(
                fields=self.step_non_side_effect_fields,
                data=steps_results,
            )

        return test_result

    @transaction.atomic
    def result_update(self, test_result: TestResult, data: dict[str, Any]) -> TestResult:
        test_result, updated_fields = test_result.model_update(
            fields=self.non_side_effect_fields,
            data=data,
            commit=False,
        )

        if updated_fields:
            test_result.test_case_version = TestCaseSelector().case_version(test_result.test.case)
        test_result.full_clean()
        test_result.save(update_fields=updated_fields)

        AttachmentService().attachments_update_content_object(data.get('attachments', []), test_result)

        for step_result_data in data.get('steps_results', []):
            step_id = step_result_data['id']
            step_result = TestStepResult.objects.filter(pk=step_id).first()
            if not step_result:
                logger.warning(f'Step {step_id} was not found')
                continue
            step_result.model_update(
                fields=self.step_non_side_effect_fields,
                data=step_result_data,
            )

        return test_result

    @classmethod
    @transaction.atomic
    def result_bulk_create(cls, results: Iterable[TestResult], user: User, batch_size: int = 500) -> list[TestResult]:
        results = bulk_create_with_history(results, TestResult, batch_size=batch_size, default_user=user)
        id_to_status = {result.test_id: result.status for result in results}
        tests = Test.objects.filter(id__in=id_to_status.keys())
        tests_to_update = []
        for test in tests:
            test.last_status = id_to_status[test.id]
            tests_to_update.append(test)
        bulk_update_with_history(
            tests_to_update,
            Test,
            batch_size=batch_size,
            default_user=user,
            fields=['last_status'],
        )
        return results

    @classmethod
    @transaction.atomic
    def result_bulk_create_from_api(
        cls,
        payload: dict[str, Any],
        test_ids: list[int],
        user_id: int,
        batch_size: int = _BATCH_SIZE,
    ) -> list[TestResult]:
        results_for_create = []
        tests_to_update = []
        user = User.objects.get(pk=user_id)
        attributes = payload.pop('attributes', {})
        general_attributes = attributes.pop('non_suite_specific', {})
        suite_specific_attributes = attributes.pop('suite_specific', [])
        attributes_validator = TestResultCustomAttributeValuesValidator()
        tests = Test.objects.filter(id__in=test_ids)
        for test in tests:
            result = TestResult(
                status_id=payload[_STATUS],
                test=test,
                user_id=user_id,
                comment=payload['comment'],
                test_case_version=TestCaseSelector().case_version(test.case),
                project_id=test.project_id,
            )
            test.last_status = result.status
            tests_to_update.append(test)
            suite_specific_attribute = next(
                (attr['values'] for attr in suite_specific_attributes if attr['suite_id'] == test.case.suite_id), {},
            )
            result.attributes = {**general_attributes, **suite_specific_attribute}
            attributes_validator(
                attrs={'attributes': result.attributes, 'test': result.test, _STATUS: result.status},
                serializer=None,
            )
            results_for_create.append(result)

        results = bulk_create_with_history(results_for_create, TestResult, batch_size=batch_size, default_user=user)
        attachments = AttachmentSelector.attachment_list().filter(id__in=payload.get('attachments', []))
        for result in results:
            for attachment in attachments:
                AttachmentService().attachment_set_content_object(attachment, result)

        step_results_for_create = []
        new_results_ids = list(
            TestResult
            .objects
            .filter(id__in=[result.id for result in results]).values('id', 'project_id', 'status_id', 'test__case_id'),
        )
        test_case_ids = [result['test__case_id'] for result in new_results_ids]
        for case_step in TestCaseStepSelector.steps_by_ids_list(test_case_ids, 'test_case_id'):
            new_result = next(
                (result for result in new_results_ids if result['test__case_id'] == case_step.test_case_id),
                None,
            )
            if new_result is None:
                continue
            step_results_for_create.append(
                TestStepResult(
                    project_id=new_result['project_id'],
                    test_result_id=new_result['id'],
                    step=case_step,
                    status_id=new_result['status_id'],
                ),
            )
        TestStepResult.objects.bulk_create(step_results_for_create)
        bulk_update_with_history(
            tests_to_update,
            Test,
            batch_size=batch_size,
            default_user=user,
            fields=['last_status'],
        )
        return results

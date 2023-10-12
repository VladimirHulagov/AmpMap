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
from typing import Any, Dict, List

from core.services.attachments import AttachmentService
from core.services.labels import LabelService
from django.db import transaction
from tests_description.models import TestCase, TestCaseStep
from tests_description.selectors.cases import TestCaseSelector, TestCaseStepSelector


class TestCaseService:
    non_side_effect_fields = ['name', 'project', 'scenario', 'expected']

    case_non_side_effect_fields = non_side_effect_fields + \
        ['suite', 'setup', 'teardown', 'estimate', 'description', 'is_steps', ]
    step_non_side_effect_fields = non_side_effect_fields + \
        ['parent_history_id', 'sort_order', 'test_case', 'test_case_history_id']

    def step_create(self, data: Dict[str, Any]) -> TestCaseStep:
        step: TestCaseStep = TestCaseStep.model_create(
            fields=self.step_non_side_effect_fields,
            data=data
        )

        for attachment in data.get('attachments', []):
            AttachmentService().attachment_set_content_object(attachment, step)

        return step

    @transaction.atomic
    def case_with_steps_create(self, data: Dict[str, Any]) -> TestCase:
        case = self.case_create(data)

        for step in data.pop('steps', []):
            step['test_case'] = case
            step['project'] = case.project
            step['test_case_history_id'] = case.history.first().history_id
            self.step_create(step)

        return case

    def case_create(self, data: Dict[str, Any]) -> TestCase:
        user = data.pop('user')
        case: TestCase = TestCase.model_create(
            fields=self.case_non_side_effect_fields,
            data=data,
        )

        for attachment in data.get('attachments', []):
            AttachmentService().attachment_set_content_object(attachment, case)

        label_kwargs = {'user': user}
        labeled_item_kwargs = {'content_object_history_id': case.history.first().history_id}
        LabelService().add(data.get('labels', []), case, label_kwargs, labeled_item_kwargs)

        return case

    @transaction.atomic
    def case_with_steps_update(self, case: TestCase, data: Dict[str, Any]) -> TestCase:
        case_steps = data.pop('steps', [])
        case = self.case_update(case, data)
        steps_id_pool: List[int] = []

        for step in case_steps:
            if 'id' in step.keys():
                if TestCaseStepSelector().step_exists(step['id']):

                    step_instance = TestCaseStep.objects.get(id=step['id'])
                    step_instance.name = step.get('name', step_instance.name)
                    step_instance.scenario = step.get('scenario', step_instance.scenario)
                    step_instance.expected = step.get('expected', step_instance.expected)
                    step_instance.sort_order = step.get('sort_order', step_instance.sort_order)
                    step_instance.test_case_history_id = case.history.first().history_id
                    step_instance.save()

                    AttachmentService().attachments_update_content_object(step.get('attachments', []), step_instance)

                    steps_id_pool.append(step_instance.id)
                else:
                    # TODO: add logging
                    continue
            else:
                step['test_case'] = case
                step['project'] = case.project
                step['test_case_history_id'] = case.history.first().history_id
                step_instance = self.step_create(step)
                steps_id_pool.append(step_instance.id)

        for step_id in TestCaseSelector().get_steps_ids_by_testcase(case):
            if step_id not in steps_id_pool:
                TestCaseStep.objects.filter(test_case=case).update(test_case_history_id=case.history.first().history_id)
                TestCaseStep.objects.filter(pk=step_id).delete()

        return case

    @transaction.atomic
    def case_update(self, case: TestCase, data: Dict[str, Any]) -> TestCase:
        user = data.pop('user')
        case, _ = case.model_update(
            fields=self.case_non_side_effect_fields,
            data=data,
            force=True
        )

        if not case.is_steps:
            TestCaseStep.objects.filter(test_case=case).update(test_case_history_id=case.history.first().history_id)
            TestCaseStep.objects.filter(test_case=case).delete()

        AttachmentService().attachments_update_content_object(data.get('attachments', []), case)

        label_kwargs = {'user': user}
        labeled_item_kwargs = {'content_object_history_id': case.history.first().history_id}
        LabelService().set(data.get('labels', []), case, label_kwargs, labeled_item_kwargs)

        return case

    @staticmethod
    def cases_copy(data):
        copied_cases = []
        for case_data in data.get('cases'):
            attrs_to_change = {}
            if suite_id := data.get('dst_suite_id'):
                attrs_to_change['suite_id'] = suite_id
            if new_name := case_data.get('new_name'):
                attrs_to_change['name'] = new_name
            case = TestCase.objects.get(pk=case_data.get('id'))
            copied_cases.append(case.model_clone(attrs_to_change=attrs_to_change))
        return copied_cases

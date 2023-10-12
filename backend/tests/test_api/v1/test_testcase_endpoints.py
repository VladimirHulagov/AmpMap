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
import datetime
import json
import re
from copy import deepcopy
from http import HTTPStatus

import pytest
from core.models import Attachment, Label, LabeledItem
from django.contrib.contenttypes.models import ContentType
from tests_description.api.v1.serializers import TestCaseRetrieveSerializer, TestCaseSerializer
from tests_description.models import TestCase, TestCaseStep

from tests import constants
from tests.commons import RequestType, model_to_dict_via_serializer
from tests.error_messages import (
    INVALID_ESTIMATE_ERR_MSG,
    NEGATIVE_ESTIMATE_ERR_MSG,
    REQUIRED_FIELD_MSG,
    TOO_BIG_ESTIMATE_ERR_MSG,
)


@pytest.mark.django_db
class TestCaseEndpoints:
    view_name_detail = 'api:v1:testcase-detail'
    view_name_list = 'api:v1:testcase-list'
    view_name_copy = 'api:v1:cases-copy'

    def test_list(self, api_client, authorized_superuser, test_case_factory, project):
        expected_instances = []
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            expected_dict = model_to_dict_via_serializer(test_case_factory(project=project), TestCaseSerializer)
            expected_instances.append(expected_dict)

        response = api_client.send_request(self.view_name_list, query_params={'project': project.id})

        for instance_dict in json.loads(response.content)['results']:
            assert instance_dict in expected_instances, f'{instance_dict} was not found in expected instances.'

    def test_retrieve(self, api_client, authorized_superuser, test_case):
        expected_dict = model_to_dict_via_serializer(
            test_case,
            TestCaseRetrieveSerializer,
            nested_fields_simple_list=['versions']
        )
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': test_case.pk})
        actual_dict = json.loads(response.content)
        assert actual_dict == expected_dict, 'Actual model dict is different from expected'

    def test_creation(self, api_client, authorized_superuser, project, test_suite):
        expected_number_of_cases = 1
        case_dict = {
            'name': constants.TEST_CASE_NAME,
            'project': project.id,
            'suite': test_suite.id,
            'setup': constants.SETUP,
            'scenario': constants.SCENARIO,
            'teardown': constants.TEARDOWN,
            'estimate': constants.INPUT_ESTIMATE
        }
        api_client.send_request(self.view_name_list, case_dict, HTTPStatus.CREATED, RequestType.POST)
        assert TestCase.objects.count() == expected_number_of_cases, f'Expected number of users ' \
                                                                     f'"{expected_number_of_cases}"' \
                                                                     f'actual: "{TestCase.objects.count()}"'

    def test_partial_update(self, api_client, authorized_superuser, test_case):
        new_name = 'new_expected_test_case_name'
        case_dict = {
            'id': test_case.id,
            'name': new_name,
            'project': test_case.project.id,
            'suite': test_case.suite.id,
            'scenario': test_case.scenario,
        }
        api_client.send_request(
            self.view_name_detail,
            case_dict,
            request_type=RequestType.PUT,
            reverse_kwargs={'pk': test_case.pk}
        )
        actual_name = TestCase.objects.get(pk=test_case.id).name
        assert actual_name == new_name, f'Names do not match. Expected name "{actual_name}", actual: "{new_name}"'

    @pytest.mark.parametrize('expected_status', [HTTPStatus.OK, HTTPStatus.BAD_REQUEST])
    def test_update(self, api_client, authorized_superuser, expected_status, test_case, project, test_suite):
        new_name = 'new_expected_test_case_name'
        case_dict = {
            'id': test_case.id,
            'name': new_name
        }
        if expected_status == HTTPStatus.OK:
            case_dict['project'] = project.id
            case_dict['suite'] = test_suite.id
            case_dict['scenario'] = constants.SCENARIO
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_case.pk},
            request_type=RequestType.PUT,
            expected_status=expected_status,
            data=case_dict
        )
        if expected_status == HTTPStatus.OK:
            actual_name = TestCase.objects.get(pk=test_case.id).name
            assert actual_name == new_name, f'Username does not match. Expected name "{actual_name}", ' \
                                            f'actual: "{new_name}"'
        else:
            assert json.loads(response.content)['project'][0] == REQUIRED_FIELD_MSG
            assert json.loads(response.content)['suite'][0] == REQUIRED_FIELD_MSG
            assert json.loads(response.content)['scenario'][0] == REQUIRED_FIELD_MSG

    def test_delete(self, api_client, authorized_superuser, test_case):
        assert TestCase.objects.count() == 1, 'Test case was not created'
        api_client.send_request(
            self.view_name_detail,
            expected_status=HTTPStatus.NO_CONTENT,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': test_case.pk}
        )
        assert not TestCase.objects.count(), f'TestCase with id "{test_case.id}" was not deleted.'

    @pytest.mark.parametrize(
        'time_value, expected_value, expected_status', [
            ('123', '2h 3m', HTTPStatus.CREATED),
            ('1w 1d 1h 1m 1s', '1w 1d 1h 1m 1s', HTTPStatus.CREATED),
            ('2:04:13:02.266', '2d 4h 13m 2s', HTTPStatus.CREATED),
            ('2 days, 4:13:02', '2d 4h 13m 2s', HTTPStatus.CREATED),
            ('2 days, 4:13:02.266', '2d 4h 13m 2s', HTTPStatus.CREATED),
            ('5hr34m56s', '5h 34m 56s', HTTPStatus.CREATED),
            ('5 hours, 34 minutes, 56 seconds', '5h 34m 56s', HTTPStatus.CREATED),
            ('365d', '52w 1d', HTTPStatus.CREATED),
            ('366d', '52w 2d', HTTPStatus.CREATED),
            (None, None, HTTPStatus.CREATED),
            ('abc', INVALID_ESTIMATE_ERR_MSG, HTTPStatus.BAD_REQUEST),
            ('-123', NEGATIVE_ESTIMATE_ERR_MSG, HTTPStatus.BAD_REQUEST),
            ('-2w', NEGATIVE_ESTIMATE_ERR_MSG, HTTPStatus.BAD_REQUEST),
            ('1231241123112312312314124121', TOO_BIG_ESTIMATE_ERR_MSG, HTTPStatus.BAD_REQUEST)
        ]
    )
    def test_estimate_field_restrictions(self, api_client, authorized_superuser, project, test_suite, time_value,
                                         expected_value, expected_status):
        case_dict = {
            'name': constants.TEST_CASE_NAME,
            'project': project.id,
            'suite': test_suite.id,
            'setup': constants.SETUP,
            'scenario': constants.SCENARIO,
            'teardown': constants.TEARDOWN,
            'estimate': time_value
        }
        response = api_client.send_request(self.view_name_list, case_dict, expected_status, RequestType.POST)
        if expected_status == HTTPStatus.CREATED:
            content = json.loads(response.content)
            actual_value = content['estimate']
            if actual_value:
                assert isinstance(TestCase.objects.get(pk=content['id']).estimate, datetime.timedelta)
        else:
            actual_value = json.loads(response.content)['errors'][0]
            expected_value = expected_value
        assert expected_value == actual_value

    def test_suite_copy_without_suite(self, api_client, authorized_superuser, attachment_factory,
                                      test_case_factory, project, test_suite, labeled_item_factory):
        case1 = test_case_factory(project=project, suite=test_suite)
        case2 = test_case_factory(project=project, suite=test_suite)
        api_client.send_request(
            self.view_name_copy,
            data={
                'cases': [{'id': case1.id}, {'id': case2.id}],
                'dst_suite_id': test_suite.id
            },
            request_type=RequestType.POST
        )
        assert TestCase.objects.filter(suite=test_suite).count() == 4

    @pytest.mark.django_db(reset_sequences=True)
    @pytest.mark.parametrize(
        'factory_name, is_steps',
        [
            ('test_case_with_steps_factory', True),
            ('test_case_factory', False)
        ],
        ids=['steps enabled', 'steps disabled']
    )
    def test_case_copy_with_relations_copy(self, api_client, authorized_superuser, attachment_factory,
                                           request, project, test_suite, labeled_item_factory, factory_name, is_steps):
        fields = ['setup', 'scenario', 'expected', 'description', 'teardown']
        case_factory = request.getfixturevalue(factory_name)
        attachments_reference_to_change = '/attachments/{0}/ Some cute cat description /attachments/4444/'
        replacement_case_name = 'Replacement case name'
        case1 = case_factory(project=project)
        case2 = case_factory(project=project)
        src_instances = [case1, case2]
        for case in src_instances:
            # Generate generic relations
            labeled_item_factory(content_object=case)
            attachment_factory(content_object=case)
            # Set attachment references in fields where it can be done
            for field in fields:
                setattr(
                    case,
                    field,
                    attachments_reference_to_change.format(
                        Attachment.objects.get(
                            content_type=ContentType.objects.get_for_model(TestCase),
                            object_id=case.id
                        ).id
                    )
                )
                case.save()
        # create attachments and references for steps
        for step in TestCaseStep.objects.all():
            attachment_factory(content_object=step)
            for field_name in ['scenario', 'expected']:
                setattr(
                    step,
                    field_name,
                    attachments_reference_to_change.format(
                        Attachment.objects.get(
                            content_type=ContentType.objects.get_for_model(TestCaseStep),
                            object_id=step.id
                        ).id
                    )
                )
                step.save()
        # check number of objects before copying
        assert not TestCase.objects.filter(suite=test_suite).count()
        if is_steps:
            assert TestCaseStep.objects.count() == constants.NUMBER_OF_OBJECTS_TO_CREATE * 2
        src_cases = model_to_dict_via_serializer(
            src_instances,
            TestCaseSerializer,
            nested_fields=['steps', 'labels'],
            many=True,
        )
        copied_cases = json.loads(
            api_client.send_request(
                self.view_name_copy,
                data={
                    'cases': [{'id': case1.id, 'new_name': replacement_case_name}, {'id': case2.id}],
                    'dst_suite_id': test_suite.id
                },
                request_type=RequestType.POST
            ).content
        )
        # check number of objects after copying
        expected_number_of_cases = 4
        assert TestCase.objects.filter(suite=test_suite).count() == 2
        if is_steps:
            assert TestCaseStep.objects.count() == constants.NUMBER_OF_OBJECTS_TO_CREATE * expected_number_of_cases
        assert LabeledItem.objects.count() == expected_number_of_cases
        assert Label.objects.count() == 2
        assert copied_cases[0]['name'] == replacement_case_name
        assert copied_cases[1]['name'] == src_cases[1]['name']
        for expected_case, actual_case in zip(src_cases, copied_cases):
            # validate copied contents that should not change
            assert expected_case['labels'] == actual_case['labels']
            assert expected_case['estimate'] == actual_case['estimate']
            # validate copied fields that should be created from start
            assert expected_case['id'] == expected_case['id']
            assert expected_case['attachments'] != actual_case['attachments']
            # validate attachments reference changed on copy
            for field_name in fields:
                assert expected_case[field_name] != actual_case[field_name]
                assert re.match(attachments_reference_to_change.format(r'\d+'), actual_case[field_name])
            # validate new steps created
            for expected_step, actual_step in zip(expected_case.get('steps', {}), actual_case.get('steps', {})):
                assert expected_step['name'] == actual_step['name']
                assert expected_step['id'] != actual_step['id']
                # validate attachments reference in steps are changed
                for key in ['scenario', 'expected']:
                    assert expected_step[key] != actual_step[key]
                    assert re.match(attachments_reference_to_change.format(r'\d+'), actual_step[key])


@pytest.mark.django_db
class TestCaseWithStepsEndpoints:
    view_name_detail = 'api:v1:testcase-detail'
    view_name_list = 'api:v1:testcase-list'

    def test_retrieve(self, api_client, authorized_superuser, test_case_with_steps):
        expected_dict = model_to_dict_via_serializer(
            test_case_with_steps,
            TestCaseRetrieveSerializer,
            nested_fields=['steps'],
            nested_fields_simple_list=['versions'],
        )
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_case_with_steps.id}
        )
        assert json.loads(response.content) == expected_dict, 'Expected and actual dict did not match'

    def test_list(self, api_client, authorized_superuser, test_case_with_steps_factory, project):
        expected_instances = []
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            expected_instances.append(test_case_with_steps_factory(project=project))
        expected_instances = model_to_dict_via_serializer(
            expected_instances,
            TestCaseSerializer,
            many=True,
            nested_fields=['steps']
        )

        response = api_client.send_request(self.view_name_list, query_params={'project': project.id})

        for instance_dict in json.loads(response.content)['results']:
            assert instance_dict in expected_instances, f'{instance_dict} was not found in expected instances.'

    @pytest.mark.parametrize('steps_number', [0, 1, 2, 10], ids=['No steps', '1 step', '2 steps', '10 steps'])
    def test_create(self, api_client, authorized_superuser, test, steps_number):
        test_case_json = {
            'test': test.id,
            'project': test.project.id,
            'suite': test.case.suite.id,
            'scenario': constants.SCENARIO,
            'name': 'Test case name',
            'is_steps': True,
            'steps': [
                {
                    'name': f'Valuable step {idx}',
                    'scenario': f'{constants.SCENARIO}{idx}',
                    'expected': f'{constants.EXPECTED}{idx}',
                } for idx in range(steps_number)
            ]
        }
        if not steps_number:
            api_client.send_request(
                self.view_name_list,
                data=test_case_json,
                request_type=RequestType.POST,
                expected_status=HTTPStatus.BAD_REQUEST,
                additional_error_msg='No error messages on zero steps when is_steps=True'
            )
            return
        created_case_id = json.loads(api_client.send_request(
            self.view_name_list,
            data=test_case_json,
            request_type=RequestType.POST,
            expected_status=HTTPStatus.CREATED
        ).content)['id']
        actual_case = json.loads(
            api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': created_case_id}).content
        )
        assert len(test_case_json['steps']) == steps_number, 'Wrong number of steps were created'
        self._validate_steps_content(test_case_json['steps'], actual_case['steps'])

    @pytest.mark.parametrize('field_to_update', ['name', 'scenario', 'expected', 'sort_order'])
    def test_update(self, api_client, authorized_superuser, test_case_with_steps, field_to_update):
        update_dict = model_to_dict_via_serializer(
            test_case_with_steps,
            TestCaseRetrieveSerializer,
            nested_fields=['steps'],
            nested_fields_simple_list=['versions']
        )
        for step, new_content in zip(update_dict['steps'], range(constants.NUMBER_OF_OBJECTS_TO_CREATE, 0, -1)):
            step[field_to_update] = str(new_content)

        api_client.send_request(
            self.view_name_detail,
            data=update_dict,
            reverse_kwargs={'pk': update_dict['id']},
            request_type=RequestType.PUT
        )
        actual_data = json.loads(
            api_client.send_request(
                self.view_name_detail,
                reverse_kwargs={'pk': update_dict['id']},
            ).content
        )
        expected_steps = reversed(update_dict['steps']) if field_to_update == 'sort_order' else update_dict['steps']
        self._validate_steps_content(expected_steps, actual_data['steps'])

    def test_update_steps_replacement(self, api_client, authorized_superuser, test_case_with_steps):
        update_dict = model_to_dict_via_serializer(
            test_case_with_steps,
            TestCaseRetrieveSerializer,
            nested_fields=['steps'],
            nested_fields_simple_list=['versions'],
        )
        new_number_of_steps = 3
        old_steps = deepcopy(update_dict['steps'])
        update_dict['steps'] = [
            {
                'name': f'Valuable step {idx}',
                'scenario': f'{constants.SCENARIO}{idx}',
                'expected': f'{constants.EXPECTED}{idx}',
            } for idx in range(new_number_of_steps)
        ]
        api_client.send_request(
            self.view_name_detail,
            data=update_dict,
            reverse_kwargs={'pk': update_dict['id']},
            request_type=RequestType.PUT
        )
        actual_data = json.loads(
            api_client.send_request(
                self.view_name_detail,
                reverse_kwargs={'pk': update_dict['id']},
            ).content
        )
        assert len(old_steps) != len(actual_data['steps']), 'Expected number of steps did not match actual'
        for step in old_steps:
            assert step not in actual_data['steps'], 'Old steps were not removed.'

    @pytest.mark.parametrize('number_of_steps', [0, 1, 2, 10], ids=['No steps', '1 step', '2 steps', '10 steps'])
    def test_update_steps_addition(self, api_client, authorized_superuser, test_case_with_steps, number_of_steps):
        update_dict = model_to_dict_via_serializer(
            test_case_with_steps,
            TestCaseRetrieveSerializer,
            nested_fields=['steps'],
            nested_fields_simple_list=['versions'],
        )
        old_steps = deepcopy(update_dict['steps'])
        new_steps = [
            {
                'name': f'Valuable step {idx}',
                'scenario': f'{constants.SCENARIO}{idx}',
                'expected': f'{constants.EXPECTED}{idx}',
            } for idx in range(number_of_steps)
        ]
        update_dict['steps'].extend(new_steps)
        actual_data = json.loads(
            api_client.send_request(
                self.view_name_detail,
                data=update_dict,
                reverse_kwargs={'pk': update_dict['id']},
                request_type=RequestType.PUT
            ).content
        )
        for step in old_steps:
            assert step in actual_data['steps'], 'Old step was removed by adding new steps.'
        assert len(actual_data['steps']) == len(old_steps) + number_of_steps, \
            'New steps were not added.'

    def test_patch_not_allowed(self, api_client, authorized_superuser, test_case):
        api_client.send_request(
            self.view_name_detail,
            data={},
            reverse_kwargs={'pk': test_case.id},
            request_type=RequestType.PATCH,
            expected_status=HTTPStatus.METHOD_NOT_ALLOWED,
            additional_error_msg='User was able to patch test case.'
        )

    @staticmethod
    def _validate_steps_content(expected, actual):
        fields_to_validate = ['name', 'scenario', 'expected']
        for expected_step, actual_step in zip(expected, actual):
            for field_name in fields_to_validate:
                assert expected_step[field_name] == actual_step[field_name], f'Field "{field_name}" ' \
                                                                             f'content does not match expected\n' \
                                                                             f'Actual content: ' \
                                                                             f'{actual_step[field_name]}'

    def test_search(self, api_client, authorized_superuser, test_case_factory, project):
        expected_cases = []
        search_name = 'search_name'
        for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            if idx % 2:
                expected_cases.append(
                    test_case_factory(name=search_name, project=project)
                )
            else:
                test_case_factory(project=project)
        expected_output = model_to_dict_via_serializer(expected_cases, TestCaseSerializer, many=True)
        actual_data = json.loads(
            api_client.send_request(
                self.view_name_list,
                query_params={'project': project.id, 'search': search_name}
            ).content
        )
        assert [expected_output] != actual_data
        actual_data = json.loads(
            api_client.send_request(
                self.view_name_list,
                query_params={
                    'project': project.id,
                    'search': 'non-existent',
                }
            ).content
        )['results']
        assert not actual_data, 'Non-existent search argument got output.'

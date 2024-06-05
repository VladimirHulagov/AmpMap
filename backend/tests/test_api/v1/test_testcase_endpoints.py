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
import operator
import re
from copy import deepcopy
from http import HTTPStatus

import pytest
from django.contrib.contenttypes.models import ContentType

from tests import constants
from tests.commons import CustomAPIClient, RequestType, model_to_dict_via_serializer
from tests.error_messages import (
    FORBIDDEN_USER_TEST_CASE,
    FOUND_EMPTY_REQUIRED_CUSTOM_ATTRIBUTES_ERR_MSG,
    INVALID_ESTIMATE_ERR_MSG,
    MISSING_REQUIRED_CUSTOM_ATTRIBUTES_ERR_MSG,
    NEGATIVE_ESTIMATE_ERR_MSG,
    REQUIRED_FIELD_MSG,
    TOO_BIG_ESTIMATE_ERR_MSG,
    WEEK_ESTIMATE_ERR_MSG,
)
from tests.mock_serializers import TestCaseMockSerializer, TestMockSerializer
from testy.core.models import Attachment, Label, LabeledItem
from testy.tests_description.api.v1.serializers import TestCaseHistorySerializer
from testy.tests_description.models import TestCase, TestCaseStep

_ERRORS = 'errors'


@pytest.mark.django_db(reset_sequences=True)
class TestCaseEndpoints:
    view_name_detail = 'api:v1:testcase-detail'
    view_name_list = 'api:v1:testcase-list'
    view_name_copy = 'api:v1:testcase-copy'
    view_name_history = 'api:v1:testcase-history'
    view_name_tests = 'api:v1:testcase-tests'
    view_restore_version = 'api:v1:testcase-restore-version'
    view_name_search = 'api:v1:testcase-search'

    def test_list(self, api_client, authorized_superuser, test_case_factory, project):
        ids = [test_case_factory(project=project).id for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)]
        expected = model_to_dict_via_serializer(
            TestCase.objects.filter(pk__in=ids),
            TestCaseMockSerializer,
            many=True,
            nested_fields_simple_list=['versions'],
        )
        response = api_client.send_request(self.view_name_list, query_params={'project': project.id})
        assert response.json()['results'] == expected

    def test_retrieve(self, api_client, authorized_superuser, test_case):
        expected_dict = model_to_dict_via_serializer(
            test_case,
            TestCaseMockSerializer,
            nested_fields_simple_list=['versions'],
        )
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': test_case.pk})
        assert response.json() == expected_dict, 'Actual model dict is different from expected'

    def test_cases_search(self, authorized_superuser_client: CustomAPIClient, test_case_factory, project, test_suite):
        name_to_find = 'Cat can walk {0}'
        name_to_skip = 'Dog can bark'
        expected_count = 5

        for idx in range(expected_count):
            test_case_factory(project=project, name=name_to_find.format(idx), suite=test_suite)

        test_case_factory(project=project, name=name_to_skip, suite=test_suite)

        test_case_factory(project=project, name=name_to_find.format(0), suite=test_suite, is_archive=True)
        test_case_factory(project=project, name=name_to_find.format(1), suite=test_suite, is_deleted=True)

        response_body = authorized_superuser_client.send_request(
            self.view_name_search,
            query_params={'search': 'cat', 'project': project.pk},
        ).json()

        assert expected_count == len(response_body[0].get('test_cases')), 'Found more cases than expected'

    def test_creation(self, api_client, authorized_superuser, project, test_suite):
        expected_number_of_cases = 1
        case_dict = {
            'name': constants.TEST_CASE_NAME,
            'project': project.id,
            'suite': test_suite.id,
            'setup': constants.SETUP,
            'scenario': constants.SCENARIO,
            'teardown': constants.TEARDOWN,
            'estimate': constants.INPUT_ESTIMATE,
        }
        api_client.send_request(self.view_name_list, case_dict, HTTPStatus.CREATED, RequestType.POST)
        assert TestCase.objects.count() == expected_number_of_cases, f'Expected number of cases ' \
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
            reverse_kwargs={'pk': test_case.pk},
        )
        actual_name = TestCase.objects.get(pk=test_case.id).name
        assert actual_name == new_name, f'Names do not match. Expected name "{actual_name}", actual: "{new_name}"'

    @pytest.mark.parametrize('expected_status', [HTTPStatus.OK, HTTPStatus.BAD_REQUEST])
    def test_update(self, api_client, authorized_superuser, expected_status, test_case, project, test_suite):
        new_name = 'new_expected_test_case_name'
        case_dict = {
            'id': test_case.id,
            'name': new_name,
        }
        expected_count_versions = TestCase.objects.get(pk=test_case.id).history.count() + 1
        if expected_status == HTTPStatus.OK:
            case_dict['project'] = project.id
            case_dict['suite'] = test_suite.id
            case_dict['scenario'] = constants.SCENARIO
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_case.pk},
            request_type=RequestType.PUT,
            expected_status=expected_status,
            data=case_dict,
        )
        if expected_status == HTTPStatus.OK:
            content = response.json()
            assert len(content['versions']) == expected_count_versions, 'New version was not created'
            actual_name = TestCase.objects.get(pk=test_case.id).name
            assert actual_name == new_name, f'Username does not match. Expected name "{actual_name}", ' \
                                            f'actual: "{new_name}"'
        else:
            assert response.json()['project'][0] == REQUIRED_FIELD_MSG
            assert response.json()['suite'][0] == REQUIRED_FIELD_MSG
            assert response.json()['scenario'][0] == REQUIRED_FIELD_MSG

    def test_delete(self, api_client, authorized_superuser, test_case):
        assert TestCase.objects.count() == 1, 'Test case was not created'
        api_client.send_request(
            self.view_name_detail,
            expected_status=HTTPStatus.NO_CONTENT,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': test_case.pk},
        )
        assert not TestCase.objects.count(), f'TestCase with id "{test_case.id}" was not deleted.'

    @pytest.mark.parametrize(
        'time_value, expected_value, expected_status', [
            ('123', '2h 3m', HTTPStatus.CREATED),
            ('1d 1h 1m 1s', '1d 1h 1m 1s', HTTPStatus.CREATED),
            ('2:04:13:02.266', '2d 4h 13m 2s', HTTPStatus.CREATED),
            ('2 days, 4:13:02', '2d 4h 13m 2s', HTTPStatus.CREATED),
            ('2 days, 4:13:02.266', '2d 4h 13m 2s', HTTPStatus.CREATED),
            ('5hr34m56s', '5h 34m 56s', HTTPStatus.CREATED),
            ('5 hours, 34 minutes, 56 seconds', '5h 34m 56s', HTTPStatus.CREATED),
            ('365d', '365d', HTTPStatus.CREATED),
            ('366d', '366d', HTTPStatus.CREATED),
            (None, None, HTTPStatus.CREATED),
            ('abc', INVALID_ESTIMATE_ERR_MSG, HTTPStatus.BAD_REQUEST),
            ('-123', NEGATIVE_ESTIMATE_ERR_MSG, HTTPStatus.BAD_REQUEST),
            ('-2d', NEGATIVE_ESTIMATE_ERR_MSG, HTTPStatus.BAD_REQUEST),
            ('1231241123112312312314124121', TOO_BIG_ESTIMATE_ERR_MSG, HTTPStatus.BAD_REQUEST),
            ('1w 1d', WEEK_ESTIMATE_ERR_MSG, HTTPStatus.BAD_REQUEST),
            ('1 week 1 day', WEEK_ESTIMATE_ERR_MSG, HTTPStatus.BAD_REQUEST),
            ('1.6 weeks 1 day', WEEK_ESTIMATE_ERR_MSG, HTTPStatus.BAD_REQUEST),
        ],
    )
    def test_estimate_field_restrictions(
        self, api_client, authorized_superuser, project, test_suite, time_value,
        expected_value, expected_status,
    ):
        case_dict = {
            'name': constants.TEST_CASE_NAME,
            'project': project.id,
            'suite': test_suite.id,
            'setup': constants.SETUP,
            'scenario': constants.SCENARIO,
            'teardown': constants.TEARDOWN,
            'estimate': time_value,
        }
        response = api_client.send_request(self.view_name_list, case_dict, expected_status, RequestType.POST)
        if expected_status == HTTPStatus.CREATED:
            content = response.json()
            actual_value = content['estimate']
            if actual_value:
                assert isinstance(TestCase.objects.get(pk=content['id']).estimate, int)
        else:
            actual_value = response.json()[_ERRORS][0]
        assert expected_value == actual_value

    def test_suite_copy_without_suite(
        self, api_client, authorized_superuser, attachment_factory,
        test_case_factory, project, test_suite, labeled_item_factory,
    ):
        case1 = test_case_factory(project=project, suite=test_suite)
        case2 = test_case_factory(project=project, suite=test_suite)
        api_client.send_request(
            self.view_name_copy,
            data={
                'cases': [{'id': case1.id}, {'id': case2.id}],
                'dst_suite_id': test_suite.id,
            },
            request_type=RequestType.POST,
        )
        assert TestCase.objects.filter(suite=test_suite).count() == 4

    @pytest.mark.django_db(reset_sequences=True)
    @pytest.mark.parametrize(
        'factory_name, is_steps',
        [
            ('test_case_with_steps_factory', True),
            ('test_case_factory', False),
        ],
        ids=['steps enabled', 'steps disabled'],
    )
    def test_case_copy_with_relations_copy(
        self, api_client, authorized_superuser, attachment_factory,
        request, project, test_suite, labeled_item_factory, factory_name, is_steps,
    ):
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
                            object_id=case.id,
                        ).id,
                    ),
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
                            object_id=step.id,
                        ).id,
                    ),
                )
                step.save()
        # check number of objects before copying
        assert not TestCase.objects.filter(suite=test_suite).count()
        if is_steps:
            assert TestCaseStep.objects.count() == constants.NUMBER_OF_OBJECTS_TO_CREATE * 2
        src_cases = model_to_dict_via_serializer(
            src_instances,
            TestCaseMockSerializer,
            nested_fields=['steps', 'labels'],
            many=True,
        )
        copied_cases = api_client.send_request(
            self.view_name_copy,
            data={
                'cases': [{'id': case1.id, 'new_name': replacement_case_name}, {'id': case2.id}],
                'dst_suite_id': test_suite.id,
            },
            request_type=RequestType.POST,
        ).json()
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

    def test_history_create(self, api_client, authorized_superuser, project, test_suite):
        create_dict = {
            'name': constants.TEST_CASE_NAME,
            'project': project.id,
            'suite': test_suite.id,
            'setup': constants.SETUP,
            'scenario': constants.SCENARIO,
            'teardown': constants.TEARDOWN,
            'estimate': constants.INPUT_ESTIMATE,
        }
        response = api_client.send_request(self.view_name_list, create_dict, HTTPStatus.CREATED, RequestType.POST)
        case_id = response.json()['id']
        response = api_client.send_request(
            self.view_name_history,
            reverse_kwargs={'pk': case_id},
        )
        content = response.json()['results']
        case_history_manager = TestCase.objects.get(pk=case_id).history
        expected_list = model_to_dict_via_serializer(
            case_history_manager.all(),
            TestCaseHistorySerializer,
            many=True,
        )
        assert len(content) == len(expected_list), 'Extra histories for test case'
        history, *_ = content  # noqa: WPS472
        assert history['user']['username'] == authorized_superuser.username, 'Users did not match'
        assert history['action'] == expected_list[0]['action'], f'Wrong action = {history["action"]}'

    def test_history_update(self, api_client, authorized_superuser, test_case, project, test_suite):
        new_name = 'new_expected_test_case_name'
        case_dict = {
            'id': test_case.id,
            'name': new_name,
            'project': project.id,
            'suite': test_suite.id,
            'scenario': constants.SCENARIO,
        }

        api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_case.pk},
            request_type=RequestType.PUT,
            expected_status=HTTPStatus.OK,
            data=case_dict,
        )
        response = api_client.send_request(
            self.view_name_history,
            reverse_kwargs={'pk': test_case.id},
        )
        content = response.json()['results']

        case_history_manager = TestCase.objects.get(pk=test_case.id).history
        expected_list = model_to_dict_via_serializer(
            case_history_manager.all().order_by('-history_id'),
            TestCaseHistorySerializer,
            many=True,
        )
        assert case_history_manager.count() == case_history_manager.count(), 'Histories did not match'
        for actual_elem, expected_elem in zip(content, expected_list):
            assert actual_elem == expected_elem

    def test_list_tests(self, api_client, authorized_superuser, test_case, test_plan_factory, test_factory):
        plan = test_plan_factory()
        expected_dict = model_to_dict_via_serializer(
            [
                test_factory(
                    project=test_case.project,
                    case=test_case,
                    plan=plan,
                ) for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)
            ],
            TestMockSerializer,
            many=True,
        )
        content = api_client.send_request(
            self.view_name_tests,
            reverse_kwargs={'pk': test_case.pk},
        ).json()['results']
        assert len(content) == len(expected_dict), 'Lengths did not match'
        for test in content:
            breadcrumbs = test.pop('breadcrumbs')
            assert breadcrumbs['id'] == plan.id
            assert breadcrumbs['title'] == plan.name
            assert breadcrumbs['parent'] is None
            assert test in expected_dict, f'Test {test} is not in response {content}'

    @pytest.mark.parametrize('expected_status', [HTTPStatus.OK, HTTPStatus.BAD_REQUEST])
    def test_update_without_new_version(
        self,
        api_client,
        authorized_superuser,
        expected_status,
        test_case,
        project,
        test_suite,
    ):
        new_name = 'new_expected_test_case_name'
        case_dict = {
            'id': test_case.id,
            'name': new_name,
            'skip_history': True,
        }
        expected_version = TestCase.objects.get(pk=test_case.id).history.latest()
        expected_version.history_user = authorized_superuser
        expected_version.save()
        expected_count_versions = TestCase.objects.get(pk=test_case.id).history.count()
        if expected_status != HTTPStatus.BAD_REQUEST:
            case_dict['project'] = project.id
            case_dict['suite'] = test_suite.id
            case_dict['scenario'] = constants.SCENARIO

        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_case.pk},
            request_type=RequestType.PUT,
            expected_status=expected_status,
            data=case_dict,
        )
        if expected_status == HTTPStatus.OK:
            content = response.json()
            actual_case = TestCase.objects.get(pk=test_case.id)
            assert actual_case.name == new_name, f'Username does not match. Expected name "{actual_case.name}", ' \
                                                 f'actual: "{new_name}"'
            assert len(content['versions']) == expected_count_versions, 'New version was created'
            assert content['current_version'] == expected_version.history_id
            assert actual_case.name == TestCase.objects.get(pk=test_case.id).history.latest().name, \
                'Historical model was not updated'
            assert actual_case.scenario == TestCase.objects.get(pk=test_case.id).history.latest().scenario
        else:
            assert response.json()['project'][0] == REQUIRED_FIELD_MSG
            assert response.json()['suite'][0] == REQUIRED_FIELD_MSG
            assert response.json()['scenario'][0] == REQUIRED_FIELD_MSG

    def test_change_version_from_another_user(
        self,
        api_client,
        authorized_superuser,
        test_case,
        project,
        test_suite,
        user_factory,
    ):
        new_name = 'new_expected_test_case_name'
        case_dict = {
            'id': test_case.id,
            'name': new_name,
            'skip_history': True,
            'project': project.id,
            'suite': test_suite.id,
            'scenario': constants.SCENARIO,
        }
        expected_version = TestCase.objects.get(pk=test_case.id).history.latest()
        expected_version.history_user = authorized_superuser
        expected_version.save()
        user = user_factory(is_superuser=True)
        api_client.force_login(user)
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_case.pk},
            request_type=RequestType.PUT,
            expected_status=HTTPStatus.BAD_REQUEST,
            data=case_dict,
        )
        assert response.json()[_ERRORS][0] == FORBIDDEN_USER_TEST_CASE

    def test_restore_version(self, api_client, authorized_superuser, test_case, attachment_factory):
        assert test_case.history.count(), 'History was not created'
        attachment = attachment_factory(content_object=test_case)
        version = test_case.history.last().id
        old_name = test_case.name
        new_name = 'new_test_case_name'
        case_dict = {
            'id': test_case.id,
            'name': new_name,
            'project': test_case.project.id,
            'suite': test_case.suite.id,
            'scenario': constants.SCENARIO,
            'attachments': [attachment.id],
        }
        api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_case.pk},
            request_type=RequestType.PUT,
            expected_status=HTTPStatus.OK,
            data=case_dict,
        )
        assert TestCase.objects.get(pk=test_case.id).name == new_name, 'Name was not updated'
        assert TestCase.objects.get(pk=test_case.id).attachments.count() == 1, 'Attachment was not set'
        new_version = TestCase.history.latest().history_id

        response = api_client.send_request(
            self.view_restore_version,
            reverse_kwargs={'pk': test_case.pk},
            request_type=RequestType.POST,
            expected_status=HTTPStatus.OK,
            data={'version': version},
        )
        assert TestCase.objects.get(pk=test_case.id).name == old_name, 'Name was not restored'
        assert not response.json().get('attachments'), 'Attachment was not deleted after restore'

        response = api_client.send_request(
            self.view_restore_version,
            reverse_kwargs={'pk': test_case.pk},
            request_type=RequestType.POST,
            expected_status=HTTPStatus.OK,
            data={'version': new_version},
        )
        assert TestCase.objects.get(pk=test_case.id).name == new_name, 'Name was not restored to new name'
        assert len(response.json().get('attachments')) == 1, 'Attachment was not restored'

    def test_test_case_created_if_all_required_custom_attributes_are_filled(
            self, api_client, authorized_superuser, project, test_suite, custom_attribute_factory,
    ):
        custom_attribute_name = 'awesome_attribute'
        custom_attribute_value = 'some_value'
        expected_number_of_cases = 1
        custom_attribute_factory(project=project, name=custom_attribute_name, is_required=True)
        case_dict = {
            'name': constants.TEST_CASE_NAME,
            'project': project.id,
            'suite': test_suite.id,
            'setup': constants.SETUP,
            'scenario': constants.SCENARIO,
            'teardown': constants.TEARDOWN,
            'estimate': constants.INPUT_ESTIMATE,
            'attributes': {custom_attribute_name: custom_attribute_value},
        }
        api_client.send_request(self.view_name_list, case_dict, HTTPStatus.CREATED, RequestType.POST)
        assert TestCase.objects.count() == expected_number_of_cases, f'Expected number of cases ' \
                                                                     f'"{expected_number_of_cases}" ' \
                                                                     f'actual: "{TestCase.objects.count()}"'

    def test_test_case_is_not_created_if_required_attribute_exists_but_is_empty(
            self, api_client, authorized_superuser, project, test_suite, custom_attribute_factory,
    ):
        custom_attribute_name = 'awesome_attribute'
        custom_attribute_factory(project=project, name=custom_attribute_name, is_required=True)
        case_dict = {
            'name': constants.TEST_CASE_NAME,
            'project': project.id,
            'suite': test_suite.id,
            'setup': constants.SETUP,
            'scenario': constants.SCENARIO,
            'teardown': constants.TEARDOWN,
            'estimate': constants.INPUT_ESTIMATE,
            'attributes': {custom_attribute_name: ''},
        }
        response = api_client.send_request(self.view_name_list, case_dict, HTTPStatus.BAD_REQUEST, RequestType.POST)
        assert response.json()[_ERRORS][0] == FOUND_EMPTY_REQUIRED_CUSTOM_ATTRIBUTES_ERR_MSG.format(
            [custom_attribute_name],
        )

    def test_test_case_not_created_if_required_custom_attribute_missing(
            self, api_client, authorized_superuser, project, test_suite, custom_attribute_factory,
    ):
        custom_attribute = custom_attribute_factory(project=project, is_required=True)
        case_dict = {
            'name': constants.TEST_CASE_NAME,
            'project': project.id,
            'suite': test_suite.id,
            'setup': constants.SETUP,
            'scenario': constants.SCENARIO,
            'teardown': constants.TEARDOWN,
            'estimate': constants.INPUT_ESTIMATE,
            'attributes': {},
        }
        response = api_client.send_request(self.view_name_list, case_dict, HTTPStatus.BAD_REQUEST, RequestType.POST)
        assert response.json()[_ERRORS][0] == MISSING_REQUIRED_CUSTOM_ATTRIBUTES_ERR_MSG.format([custom_attribute.name])

    def test_test_case_is_created_if_the_required_custom_attribute_is_not_test_case_specific(
            self, api_client, authorized_superuser, project, test_suite, allowed_content_types,
            custom_attribute_factory,
    ):
        expected_number_of_cases = 1
        test_case_content_type_id = ContentType.objects.get_for_model(TestCase).id
        allowed_content_types.remove(test_case_content_type_id)
        custom_attribute_factory(project=project, is_required=True, content_types=allowed_content_types)
        case_dict = {
            'name': constants.TEST_CASE_NAME,
            'project': project.id,
            'suite': test_suite.id,
            'setup': constants.SETUP,
            'scenario': constants.SCENARIO,
            'teardown': constants.TEARDOWN,
            'estimate': constants.INPUT_ESTIMATE,
            'attributes': {},
        }
        api_client.send_request(self.view_name_list, case_dict, HTTPStatus.CREATED, RequestType.POST)
        assert TestCase.objects.count() == expected_number_of_cases, f'Expected number of cases ' \
                                                                     f'"{expected_number_of_cases}"' \
                                                                     f'actual: "{TestCase.objects.count()}"'

    @pytest.mark.parametrize(
        'estimate, seconds, output_estimate',
        [
            ('16h', 60 * 60 * 8 * 2, '2d'),
            ('24h', 60 * 60 * 8 * 3, '3d'),
            ('2d', 60 * 60 * 8 * 2, '2d'),
            ('3d', 60 * 60 * 8 * 3, '3d'),
            ('29h', 3600 * 8 * 3 + 3600 * 5, '3d 5h'),
            ('3d 5h', 3600 * 8 * 3 + 3600 * 5, '3d 5h'),
            ('3:05:00:00', 3600 * 8 * 3 + 3600 * 5, '3d 5h'),
        ],
    )
    def test_correct_estimates(
        self,
        api_client,
        authorized_superuser,
        project,
        test_suite,
        estimate,
        seconds,
        output_estimate,
    ):
        case_dict = {
            'name': constants.TEST_CASE_NAME,
            'project': project.id,
            'suite': test_suite.id,
            'setup': constants.SETUP,
            'scenario': constants.SCENARIO,
            'teardown': constants.TEARDOWN,
            'estimate': estimate,
        }
        api_client.send_request(self.view_name_list, case_dict, HTTPStatus.CREATED, RequestType.POST)
        test_case = TestCase.objects.last()
        assert test_case.estimate == seconds, 'Wrong seconds in database'
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': test_case.id})
        assert response.json()['estimate'] == output_estimate, 'Wrong estimate value in response'

    def test_single_search_by_label(
        self,
        api_client,
        authorized_superuser,
        test_case_factory,
        project,
        labeled_item_factory,
        label_factory,
    ):
        first_label = label_factory(name='first')
        second_label = label_factory(name='second')
        with_first_label = []
        with_second_label = []
        for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            if idx % 2:
                test_case = test_case_factory(project=project)
                labeled_item_factory(content_object=test_case, label=first_label)
                with_first_label.append(test_case)
            else:
                test_case = test_case_factory(project=project)
                labeled_item_factory(content_object=test_case, label=second_label)
                with_second_label.append(test_case)

        for label, expected_instances in ((first_label, with_first_label), (second_label, with_second_label)):
            expected_output = model_to_dict_via_serializer(
                expected_instances,
                TestCaseMockSerializer,
                many=True,
                nested_fields_simple_list=['versions', 'labels'],
            )

            actual_data = api_client.send_request(
                self.view_name_list,
                query_params={'project': project.id, 'labels': label.id},
            ).json()['results']
            assert expected_output == actual_data

    @pytest.mark.parametrize('operation, labels_condition', [(operator.and_, 'and'), (operator.or_, 'or')])
    def test_multiple_search_by_label(
        self,
        api_client,
        authorized_superuser,
        test_case_factory,
        project,
        labeled_item_factory,
        label_factory,
        operation,
        labels_condition,
    ):
        first_label = label_factory(name='first')
        second_label = label_factory(name='second')
        with_first_label = set()
        with_second_label = set()
        for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            if idx % 2:
                test_case = test_case_factory(project=project)
                labeled_item_factory(content_object=test_case, label=first_label)
                with_first_label.add(test_case)
            if idx % 3:
                test_case = test_case_factory(project=project)
                labeled_item_factory(content_object=test_case, label=second_label)
                with_second_label.add(test_case)
        expected_output = model_to_dict_via_serializer(
            list(operation(with_first_label, with_second_label)),
            TestCaseMockSerializer,
            many=True,
            nested_fields_simple_list=['versions', 'labels'],
        )
        actual_data = api_client.send_request(
            self.view_name_list,
            query_params={
                'project': project.id,
                'labels': ','.join([str(first_label.pk), str(second_label.pk)]),
                'labels_condition': labels_condition,
            },
        ).json()['results']
        assert expected_output == actual_data


@pytest.mark.django_db(reset_sequences=True)
class TestCaseWithStepsEndpoints:
    view_name_detail = 'api:v1:testcase-detail'
    view_name_list = 'api:v1:testcase-list'
    view_restore_version = 'api:v1:testcase-restore-version'

    def test_retrieve(self, api_client, authorized_superuser, test_case_with_steps):
        expected_dict = model_to_dict_via_serializer(
            test_case_with_steps,
            TestCaseMockSerializer,
            nested_fields=['steps'],
            nested_fields_simple_list=['versions'],
        )
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_case_with_steps.id},
        )
        assert response.json() == expected_dict, 'Expected and actual dict did not match'

    def test_list(self, api_client, authorized_superuser, test_case_with_steps_factory, project):
        expected_instances = []
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            expected_instances.append(test_case_with_steps_factory(project=project))
        expected_instances = model_to_dict_via_serializer(
            expected_instances,
            TestCaseMockSerializer,
            many=True,
            nested_fields=['steps'],
            nested_fields_simple_list=['versions'],
        )

        response = api_client.send_request(self.view_name_list, query_params={'project': project.id})
        assert response.json()['results'] == expected_instances

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
            ],
        }
        if not steps_number:
            api_client.send_request(
                self.view_name_list,
                data=test_case_json,
                request_type=RequestType.POST,
                expected_status=HTTPStatus.BAD_REQUEST,
                additional_error_msg='No error messages on zero steps when is_steps=True',
            )
            return
        created_case_id = api_client.send_request(
            self.view_name_list,
            data=test_case_json,
            request_type=RequestType.POST,
            expected_status=HTTPStatus.CREATED,
        ).json()['id']
        actual_case = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': created_case_id}).json()
        assert len(test_case_json['steps']) == steps_number, 'Wrong number of steps were created'
        self._validate_steps_content(test_case_json['steps'], actual_case['steps'])

    @pytest.mark.parametrize('field_to_update', ['name', 'scenario', 'expected', 'sort_order'])
    def test_update(self, api_client, authorized_superuser, test_case_with_steps, field_to_update):
        update_dict = model_to_dict_via_serializer(
            test_case_with_steps,
            TestCaseMockSerializer,
            nested_fields=['steps'],
            nested_fields_simple_list=['versions'],
        )
        for step, new_content in zip(update_dict['steps'], range(constants.NUMBER_OF_OBJECTS_TO_CREATE, 0, -1)):
            step[field_to_update] = str(new_content)

        api_client.send_request(
            self.view_name_detail,
            data=update_dict,
            reverse_kwargs={'pk': update_dict['id']},
            request_type=RequestType.PUT,
        )
        actual_data = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': update_dict['id']},
        ).json()
        expected_steps = reversed(update_dict['steps']) if field_to_update == 'sort_order' else update_dict['steps']
        self._validate_steps_content(expected_steps, actual_data['steps'])

    def test_update_steps_replacement(self, api_client, authorized_superuser, test_case_with_steps):
        update_dict = model_to_dict_via_serializer(
            test_case_with_steps,
            TestCaseMockSerializer,
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
            request_type=RequestType.PUT,
        )
        actual_data = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': update_dict['id']},
        ).json()
        assert len(old_steps) != len(actual_data['steps']), 'Expected number of steps did not match actual'
        for step in old_steps:
            assert step not in actual_data['steps'], 'Old steps were not removed.'

    @pytest.mark.parametrize('number_of_steps', [0, 1, 2, 10], ids=['No steps', '1 step', '2 steps', '10 steps'])
    def test_update_steps_addition(self, api_client, authorized_superuser, test_case_with_steps, number_of_steps):
        update_dict = model_to_dict_via_serializer(
            test_case_with_steps,
            TestCaseMockSerializer,
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
        actual_data = api_client.send_request(
            self.view_name_detail,
            data=update_dict,
            reverse_kwargs={'pk': update_dict['id']},
            request_type=RequestType.PUT,
        ).json()
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
            additional_error_msg='User was able to patch test case.',
        )

    def test_search(self, api_client, authorized_superuser, test_case_factory, project):
        expected_cases = []
        search_name = 'search_name'
        for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            if idx % 2:
                expected_cases.append(
                    test_case_factory(name=search_name, project=project),
                )
            else:
                test_case_factory(project=project)
        expected_output = model_to_dict_via_serializer(expected_cases, TestCaseMockSerializer, many=True)
        actual_data = api_client.send_request(
            self.view_name_list,
            query_params={'project': project.id, 'search': search_name},
        ).json()
        assert actual_data != [expected_output]
        actual_data = api_client.send_request(
            self.view_name_list,
            query_params={
                'project': project.id,
                'search': 'non-existent',
            },
        ).json()['results']
        assert not actual_data, 'Non-existent search argument got output.'

    @pytest.mark.parametrize(
        'is_case_attachment, is_steps_attachment',
        [
            [False, False],
            [True, False],
            [False, True],
            [True, True],
        ],
    )
    def test_restore_version_with_steps(
        self, api_client, authorized_superuser, attachment_factory,
        is_case_attachment, is_steps_attachment, test,
    ):
        test_case_json = {
            'test': test.id,
            'project': test.project.id,
            'suite': test.case.suite.id,
            'scenario': constants.SCENARIO,
            'name': 'Test case name',
            'is_steps': True,
            'attachments': [attachment_factory(content_type=None, object_id=None).id] if is_case_attachment else [],
            'steps': [
                {
                    'name': f'Valuable step {idx}',
                    'scenario': f'{constants.SCENARIO}{idx}',
                    'expected': f'{constants.EXPECTED}{idx}',
                    'attachments': [attachment_factory(content_type=None, object_id=None).id]
                    if is_steps_attachment else [],
                } for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)
            ],
        }
        created_case_id = api_client.send_request(
            self.view_name_list,
            data=test_case_json,
            request_type=RequestType.POST,
            expected_status=HTTPStatus.CREATED,
        ).json()['id']

        test_case = TestCase.objects.get(pk=created_case_id)
        version = test_case.history.latest().history_id
        assert bool(test_case.attachments.count()) == is_case_attachment
        for step in test_case.steps.all():
            assert bool(step.attachments.count()) == is_steps_attachment

        old_name = test_case.name
        new_name = 'new_test_case_name'
        case_dict = {
            'id': test_case.id,
            'name': new_name,
            'project': test_case.project.id,
            'suite': test_case.suite.id,
            'scenario': constants.SCENARIO,
            'is_steps': False,
            'steps': [],
            'attachments': [],
        }
        api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_case.id},
            request_type=RequestType.PUT,
            expected_status=HTTPStatus.OK,
            data=case_dict,
        )
        updated_test_case = TestCase.objects.get(pk=test_case.id)

        assert updated_test_case.name == new_name, 'Name was not updated'
        assert updated_test_case.steps.count() == 0, 'Steps were not deleted'
        assert updated_test_case.attachments.count() == 0
        for step in updated_test_case.steps.all():
            assert bool(step.attachments.count()) == is_steps_attachment

        for idx in range(1, 10):
            previous_version = test_case.history.latest().history_id

            content = api_client.send_request(
                self.view_restore_version,
                reverse_kwargs={'pk': test_case.pk},
                request_type=RequestType.POST,
                expected_status=HTTPStatus.OK,
                data={'version': version},
            ).json()
            restored_test_case = TestCase.objects.get(pk=test_case.id)
            expected_name = old_name if idx % 2 else new_name
            expected_case_value = idx % 2 if is_case_attachment else 0
            expected_step_value = idx % 2 if is_steps_attachment else 0
            expected_step_count = constants.NUMBER_OF_OBJECTS_TO_CREATE if idx % 2 else 0
            assert restored_test_case.name == expected_name, 'Name was not restored'
            assert restored_test_case.attachments.count() == expected_case_value
            assert len(content.get('steps')) == expected_step_count, \
                'Steps were not restored after restore'

            for step in restored_test_case.steps.all():
                assert step.attachments.count() == expected_step_value
            version = previous_version

    def test_restore_steps_attachments(self, api_client, authorized_superuser, attachment_factory, test):
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
                    'attachments': [attachment_factory(content_type=None, object_id=None).id],
                } for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)
            ],
        }

        created_case_id = api_client.send_request(
            self.view_name_list,
            data=test_case_json,
            request_type=RequestType.POST,
            expected_status=HTTPStatus.CREATED,
        ).json()['id']

        for step in test_case_json['steps']:
            step.pop('attachments')

        test_case = TestCase.objects.get(pk=created_case_id)
        version = test_case.history.latest().history_id
        for step in test_case.steps.all():
            assert step.attachments.count() == 1

        api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_case.id},
            request_type=RequestType.PUT,
            expected_status=HTTPStatus.OK,
            data=test_case_json,
        )
        for step in test_case.steps.all():
            assert step.attachments.count() == 0

        for idx in range(1, 10):
            previous_version = test_case.history.latest().history_id
            api_client.send_request(
                self.view_restore_version,
                reverse_kwargs={'pk': test_case.pk},
                request_type=RequestType.POST,
                expected_status=HTTPStatus.OK,
                data={'version': version},
            )
            for step in test_case.steps.all():
                assert step.attachments.count() == idx % 2
            version = previous_version

    @pytest.mark.parametrize('expected_status', [HTTPStatus.OK, HTTPStatus.BAD_REQUEST])
    @pytest.mark.parametrize('field_to_update', ['name', 'scenario', 'expected', 'sort_order'])
    def test_update_without_new_version(
        self, api_client, authorized_superuser,
        test_case_with_steps, field_to_update, expected_status, user,
    ):
        update_dict = model_to_dict_via_serializer(
            test_case_with_steps,
            TestCaseMockSerializer,
            nested_fields=['steps'],
            nested_fields_simple_list=['versions'],
        )

        update_dict['skip_history'] = True
        version = TestCase.objects.get(pk=test_case_with_steps.id).history.latest()
        current_user = authorized_superuser if expected_status == HTTPStatus.OK else user
        version.history_user = current_user
        version.save()

        current_user = authorized_superuser if expected_status == HTTPStatus.OK else user
        for step in test_case_with_steps.steps.all():
            step.history.all().update(history_user=current_user)

        expected_count_case_versions = TestCase.objects.get(pk=test_case_with_steps.id).history.count()
        expected_count_step_versions = 1
        for step, new_content in zip(update_dict['steps'], range(constants.NUMBER_OF_OBJECTS_TO_CREATE, 0, -1)):
            step[field_to_update] = str(new_content)

        response = api_client.send_request(
            self.view_name_detail,
            data=update_dict,
            reverse_kwargs={'pk': update_dict['id']},
            request_type=RequestType.PUT,
            expected_status=expected_status,
        )
        if expected_status == HTTPStatus.OK:
            actual_data = api_client.send_request(
                self.view_name_detail,
                reverse_kwargs={'pk': update_dict['id']},
            ).json()
            expected_steps = reversed(update_dict['steps']) if field_to_update == 'sort_order' else update_dict['steps']
            self._validate_steps_content(expected_steps, actual_data['steps'])
            assert len(actual_data['versions']) == expected_count_case_versions, 'New version of test case was created'
            for step in TestCase.objects.get(pk=test_case_with_steps.id).steps.all():
                assert step.history.count() == expected_count_step_versions, (
                    f'New version of step '
                    f'id={step.id} was created'
                )
        else:
            assert response.json()[_ERRORS][0] == FORBIDDEN_USER_TEST_CASE

    @classmethod
    def _validate_steps_content(cls, expected, actual):
        fields_to_validate = ['name', 'scenario', 'expected']
        for expected_step, actual_step in zip(expected, actual):
            for field_name in fields_to_validate:
                assert expected_step[field_name] == actual_step[field_name], f'Field "{field_name}" ' \
                                                                             f'content does not match expected\n' \
                                                                             f'Actual content: ' \
                                                                             f'{actual_step[field_name]}'

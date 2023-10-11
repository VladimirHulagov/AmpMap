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

import json
from http import HTTPStatus

import pytest
from django.conf import settings
from django.utils import timezone
from tests_representation.api.v1.serializers import TestResultSerializer
from tests_representation.choices import TestStatuses
from tests_representation.models import TestResult

from tests import constants
from tests.commons import RequestType, model_to_dict_via_serializer
from tests.error_messages import PERMISSION_ERR_MSG


@pytest.mark.django_db(reset_sequences=True)
class TestResultEndpoints:
    view_name_list = 'api:v1:testresult-list'
    view_name_detail = 'api:v1:testresult-detail'
    project_view_name_detail = 'api:v1:project-detail'
    plan_view_name_detail = 'api:v1:testplan-detail'

    def test_list(self, api_client, authorized_superuser, test_result_factory, project):
        expected_instances = model_to_dict_via_serializer(
            [test_result_factory(project=project) for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)],
            TestResultSerializer,
            many=True
        )

        response = api_client.send_request(self.view_name_list, query_params={'project': project.id})

        for instance_dict in json.loads(response.content):
            assert instance_dict in expected_instances, f'{instance_dict} was not found in expected instances.'

    def test_retrieve(self, api_client, authorized_superuser, test_result):
        expected_dict = model_to_dict_via_serializer(test_result, TestResultSerializer)
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': test_result.pk})
        actual_dict = json.loads(response.content)
        assert actual_dict == expected_dict, 'Actual model dict is different from expected'

    def test_partial_update(self, api_client, authorized_superuser, test_result, user):
        update_dict = {
            'user': user.id,
            'status': 3,
            'comment': 'new_comment',
        }
        api_client.send_request(
            self.view_name_detail,
            update_dict,
            request_type=RequestType.PATCH,
            reverse_kwargs={'pk': test_result.pk}
        )
        actual_dict = model_to_dict_via_serializer(TestResult.objects.get(pk=test_result.id), TestResultSerializer)
        for key in update_dict.keys():
            assert update_dict[key] == actual_dict[key], f'Field "{key}" was not updated.'

    def test_update(self, api_client, authorized_superuser, test_result, user):
        update_dict = {
            'id': test_result.id,
            'test': test_result.test.id,
            'user': user.id,
            'status': 3,
            'comment': 'new_comment',

        }
        api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_result.pk},
            request_type=RequestType.PUT,
            expected_status=HTTPStatus.OK,
            data=update_dict
        )
        actual_dict = model_to_dict_via_serializer(TestResult.objects.get(pk=test_result.id), TestResultSerializer)
        for key in update_dict.keys():
            assert update_dict[key] == actual_dict[key], f'Field "{key}" was not updated.'

    def test_add_results_to_test(self, api_client, authorized_superuser, user, test_factory):
        tests = [test_factory(), test_factory()]
        for test in tests:
            result_dict = {
                'status': TestStatuses.UNTESTED,
                'user': user.id,
                'comment': constants.TEST_COMMENT,
                'test': test.id
            }
            api_client.send_request(
                'api:v1:testresult-list',
                expected_status=HTTPStatus.CREATED,
                request_type=RequestType.POST,
                data=result_dict,
            )
        assert TestResult.objects.count() == 2, 'Expected number of results was not created.'
        assert TestResult.objects.filter(test=tests[0]).count() == 1, f'Only 1 result should be on a test "{tests[0]}"'
        assert TestResult.objects.filter(test=tests[1]).count() == 1, f'Only 1 result should be on a test "{tests[1]}"'

    def test_get_results_by_test(self, api_client, test_result_factory, test_factory, authorized_superuser, project):
        test1 = test_factory()
        test2 = test_factory()

        dicts_test1 = model_to_dict_via_serializer(
            [test_result_factory(test=test1, project=project) for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)],
            TestResultSerializer,
            many=True
        )
        dicts_test2 = model_to_dict_via_serializer(
            [test_result_factory(test=test2, project=project) for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)],
            TestResultSerializer,
            many=True
        )

        response_test1 = api_client.send_request(
            'api:v1:testresult-list',
            expected_status=HTTPStatus.OK,
            request_type=RequestType.GET,
            query_params={'test': test1.id, 'project': project.id}
        )
        response_test2 = api_client.send_request(
            'api:v1:testresult-list',
            expected_status=HTTPStatus.OK,
            request_type=RequestType.GET,
            query_params={'test': test2.id, 'project': project.id}
        )
        actual_results1 = json.loads(response_test1.content)
        actual_results2 = json.loads(response_test2.content)
        assert actual_results1 and actual_results2
        assert len(actual_results1) == len(actual_results2)
        for result_test1, result_test2 in zip(actual_results1, actual_results2):
            assert result_test1 in dicts_test1, 'Response is different from expected one'
            assert result_test2 in dicts_test2, 'Response is different from expected one'

    @pytest.mark.parametrize('request_type', [RequestType.PATCH, RequestType.PUT, RequestType.DELETE, RequestType.POST])
    def test_result_permissions(self, api_client, authorized_superuser, test_result_factory, user,
                                request_type, project_factory, test_factory):
        api_client.force_login(user)
        result = test_result_factory(project=project_factory(is_archive=True))
        if request_type != RequestType.POST:
            response = api_client.send_request(
                self.view_name_detail,
                reverse_kwargs={'pk': result.pk},
                request_type=request_type,
                expected_status=HTTPStatus.FORBIDDEN,
                data={}
            )
        else:
            test = test_factory(project=project_factory(is_archive=True))
            response = api_client.send_request(
                self.view_name_list,
                request_type=request_type,
                expected_status=HTTPStatus.FORBIDDEN,
                data={
                    'status': TestStatuses.UNTESTED,
                    'user': user.id,
                    'comment': constants.TEST_COMMENT,
                    'test': test.id
                }
            )
        assert json.loads(response.content)['detail'] == PERMISSION_ERR_MSG

    @pytest.mark.parametrize('request_type', [RequestType.PATCH, RequestType.PUT])
    @pytest.mark.parametrize('invalid_by', ['time', 'version'])
    def test_result_update_constraints(self, api_client, authorized_superuser, test_case, test_factory, invalid_by,
                                       request_type):
        test = test_factory(case=test_case)
        update_dict = {
            'status': 3,
            'comment': 'new_comment',
        }
        result_id = json.loads(
            api_client.send_request(
                self.view_name_list,
                data={
                    'project': test.project.id,
                    'test': test.id,
                    'status': 0,
                    'comment': 'Src comment',
                },
                request_type=RequestType.POST,
                expected_status=HTTPStatus.CREATED
            ).content)['id']

        if invalid_by == 'time':
            result = TestResult.objects.get(pk=result_id)
            result.created_at = timezone.now() - timezone.timedelta(hours=settings.TEST_RESULT_UPDATE_GAP, minutes=1)
            result.save()
        else:
            old_version = test_case.history.first().history_id
            api_client.send_request(
                'api:v1:testcase-detail',
                data={
                    'project': test.case.project.id,
                    'suite': test.case.suite.id,
                    'name': test.case.name,
                    'scenario': 'new_scenario'
                },
                request_type=RequestType.PUT,
                reverse_kwargs={'pk': test_case.pk},
                expected_status=HTTPStatus.OK
            )
            assert old_version != test_case.history.first().history_id, 'Test case version did not change'

        api_client.send_request(
            self.view_name_detail,
            data=update_dict,
            reverse_kwargs={'pk': result_id},
            request_type=RequestType.PATCH,
            expected_status=HTTPStatus.BAD_REQUEST
        )

    @pytest.mark.parametrize(
        'view_name, query_param_key', [
            (project_view_name_detail, 'project'),
            (plan_view_name_detail, 'test_plan'),
        ]
    )
    def test_soft_delete(self, api_client, authorized_superuser, test_result_factory, project, test_factory, test_plan,
                         view_name, query_param_key):
        test = test_factory(project=project, plan=test_plan)
        parent_id = locals()[query_param_key].id
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            test_result_factory(test=test, project=project)
        response = api_client.send_request(self.view_name_list, query_params={'project': project.id})
        assert len(json.loads(response.content)) == constants.NUMBER_OF_OBJECTS_TO_CREATE
        api_client.send_request(
            view_name,
            reverse_kwargs={'pk': parent_id},
            request_type=RequestType.DELETE,
            expected_status=HTTPStatus.NO_CONTENT
        )
        assert not len(TestResult.objects.all()), 'Test results were not cascade deleted'
        assert len(TestResult.deleted_objects.all()) == constants.NUMBER_OF_OBJECTS_TO_CREATE

    @pytest.mark.parametrize(
        'view_name, query_param_key', [
            (project_view_name_detail, 'project'),
            (plan_view_name_detail, 'test_plan'),
        ]
    )
    def test_restore(self, api_client, authorized_superuser, test_result_factory, project, test_factory, test_plan,
                     view_name, query_param_key):
        test = test_factory(project=project, plan=test_plan)
        parent_id = locals()[query_param_key].id
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            test_result_factory(test=test, project=project)
        response = api_client.send_request(self.view_name_list, query_params={'project': project.id})
        assert len(json.loads(response.content)) == constants.NUMBER_OF_OBJECTS_TO_CREATE
        api_client.send_request(
            view_name,
            reverse_kwargs={'pk': parent_id},
            request_type=RequestType.DELETE,
            expected_status=HTTPStatus.NO_CONTENT
        )
        assert not len(TestResult.objects.all()), 'Test results were not cascade deleted'
        assert len(TestResult.deleted_objects.all()) == constants.NUMBER_OF_OBJECTS_TO_CREATE

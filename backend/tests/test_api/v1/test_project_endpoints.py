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
import os
from http import HTTPStatus
from operator import itemgetter
from unittest import mock

import pytest
from core.api.v1.serializers import ProjectRetrieveSerializer
from core.models import Project
from django.utils import timezone
from tests_description.models import TestCase
from tests_representation.choices import TestStatuses
from tests_representation.models import Parameter, TestResult

from tests import constants
from tests.commons import RequestType, model_to_dict_via_serializer
from tests.error_messages import PERMISSION_ERR_MSG, REQUIRED_FIELD_MSG


@pytest.mark.django_db
class TestProjectEndpoints:
    view_name_list = 'api:v1:project-list'
    view_name_detail = 'api:v1:project-detail'
    view_name_progress = 'api:v1:project-progress'

    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_list(self, api_client, authorized_superuser, project_factory, create_file, extension):
        expected_instances = []
        additional_info_fields = {'cases_count': 0, 'plans_count': 0, 'suites_count': 0, 'tests_count': 0}
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            model_dict = model_to_dict_via_serializer(project_factory(), ProjectRetrieveSerializer)
            model_dict.update(additional_info_fields)
            expected_instances.append(model_dict)

        response = api_client.send_request(self.view_name_list)
        for instance in json.loads(response.content):
            assert instance in expected_instances

    def test_retrieve(self, api_client, authorized_superuser, project):
        expected_dict = model_to_dict_via_serializer(project, ProjectRetrieveSerializer)
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': project.pk})
        actual_dict = json.loads(response.content)
        assert actual_dict == expected_dict

    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_creation(self, api_client, authorized_superuser, create_file, extension):
        expected_number_of_parameters = 1
        project_dict = {
            'name': constants.PROJECT_NAME,
            'description': constants.DESCRIPTION,
            'icon': create_file,
        }
        api_client.send_request(
            self.view_name_list,
            project_dict,
            HTTPStatus.CREATED,
            RequestType.POST,
            format='multipart'
        )
        assert Project.objects.count() == expected_number_of_parameters, f'Expected number of projects is ' \
                                                                         f'"{expected_number_of_parameters}"' \
                                                                         f'actual: "{Parameter.objects.count()}"'
        assert os.path.isfile(Project.objects.first().icon.path)

    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_partial_update(self, api_client, authorized_superuser, project, create_file, extension):
        new_name = 'new_name'
        assert not project.icon
        project_dict = {
            'id': project.id,
            'name': new_name,
            'icon': create_file
        }
        api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': project.pk},
            request_type=RequestType.PATCH,
            data=project_dict,
            format='multipart'
        )
        instance = Project.objects.get(pk=project.id)
        actual_name = instance.name
        icon_path = instance.icon.path
        assert os.path.isfile(icon_path)
        assert actual_name == new_name, f'New name does not match. Expected name "{new_name}", actual: "{actual_name}"'
        api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': project.pk},
            request_type=RequestType.PATCH,
            data={'icon': ''},
            format='multipart'
        )
        assert not os.path.isfile(icon_path)

    @pytest.mark.parametrize(
        'expected_status, extension',
        [(HTTPStatus.OK, '.jpeg'), (HTTPStatus.BAD_REQUEST, '.jpeg')]
    )
    def test_update(self, api_client, authorized_superuser, project, expected_status, create_file, extension):
        new_name = 'new_name'
        project_dict = {
            'id': project.id,
            'icon': create_file
        }
        if expected_status == HTTPStatus.OK:
            project_dict['name'] = new_name
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': project.pk},
            request_type=RequestType.PUT,
            expected_status=expected_status,
            data=project_dict,
            format='multipart'
        )
        if expected_status == HTTPStatus.OK:
            instance = Project.objects.get(pk=project.id)
            actual_name = instance.name
            icon_path = instance.icon.path
            assert os.path.isfile(icon_path)
            assert actual_name == new_name, f'Project name do not match. Expected name "{actual_name}", ' \
                                            f'actual: "{new_name}"'
        else:
            assert json.loads(response.content)['name'][0] == REQUIRED_FIELD_MSG

    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_delete(self, api_client, authorized_superuser, project_factory, create_file, extension):
        project = project_factory(icon=create_file)
        assert Project.objects.count() == 1, 'Project was not created'
        icon_path = project.icon.path
        api_client.send_request(
            self.view_name_detail,
            expected_status=HTTPStatus.NO_CONTENT,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': project.pk}
        )
        assert not Project.objects.count(), f'Project with id "{project.id}" was not deleted.'
        assert not os.path.isfile(icon_path), 'Icon was not deleted'

    def test_valid_project_assignation(self, api_client, authorized_superuser, user, test):
        result_dict = {
            'status': TestStatuses.UNTESTED,
            'test': test.id,
            'user': user.id,
            'comment': constants.TEST_COMMENT,
        }
        api_client.send_request(
            'api:v1:testresult-list',
            result_dict,
            HTTPStatus.CREATED,
            RequestType.POST,
        )

        expected_project = TestCase.objects.all()[0].project

        result_project = TestResult.objects.all()[0].project

        assert test.project == expected_project, f'Test was not created with correct project, ' \
                                                 f'expected project: {expected_project}' \
                                                 f'actual project: {test.project}'
        assert result_project == expected_project, f'Test result was not created with correct project, ' \
                                                   f'expected project: {expected_project}' \
                                                   f'actual project: {result_project}'

    @pytest.mark.parametrize('request_type', [RequestType.PATCH, RequestType.PUT])
    def test_archived_editable_for_admin_only(self, api_client, authorized_superuser, project_factory, user,
                                              request_type):
        api_client.force_login(user)
        project = project_factory(is_archive=True)
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': project.pk},
            request_type=request_type,
            expected_status=HTTPStatus.FORBIDDEN,
            data={}
        )
        assert json.loads(response.content)['detail'] == PERMISSION_ERR_MSG

    @pytest.mark.django_db(reset_sequences=True)
    @pytest.mark.parametrize(
        'data_fixture_name',
        [
            'multiple_plans_data_project_statistics',
            'result_filter_data_project_statistics',
            'data_different_statuses_project_statistics',
            'empty_plan_data_project_statistics'
        ]
    )
    def test_project_progress(
            self,
            api_client,
            authorized_superuser,
            project,
            data_fixture_name,
            request
    ):
        expected, start_date, end_date = request.getfixturevalue(data_fixture_name)

        response = api_client.send_request(
            self.view_name_progress,
            reverse_kwargs={'pk': project.pk},
            query_params={
                'start_date': start_date,
                'end_date': end_date,
            },
            expected_status=HTTPStatus.OK
        )
        results = json.loads(response.content)
        assert results.sort(key=itemgetter('id')) == expected.sort(key=itemgetter('id'))

    @pytest.mark.parametrize(
        'query_params',
        [
            {'start_date': timezone.datetime(2000, 1, 1)},
            {'end_date': timezone.datetime(2000, 1, 1)}
        ],
        ids=['only start provided', 'only end provided']
    )
    def test_default_filter_period(
            self,
            api_client,
            project,
            authorized_superuser,
            query_params,
            test_plan_factory,
            test_factory,
            test_result_factory
    ):
        with mock.patch(
                'django.utils.timezone.now',
                return_value=timezone.make_aware(timezone.datetime(2000, 1, 2), timezone.utc)
        ):
            plan = test_plan_factory(project=project)
            test_result_factory(test=test_factory(plan=plan))

        content = api_client.send_request(
            self.view_name_progress,
            reverse_kwargs={'pk': project.pk},
            expected_status=HTTPStatus.OK,
            query_params=query_params,
        ).content
        assert json.loads(content), 'Info about plan was not included in response.'

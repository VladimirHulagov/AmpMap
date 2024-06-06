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
import os
from copy import deepcopy
from http import HTTPStatus
from operator import itemgetter
from unittest import mock

import pytest
from django.db.models import Q
from django.utils import timezone
from utilities.time import WorkTimeProcessor

from tests import constants
from tests.commons import RequestType, model_to_dict_via_serializer
from tests.error_messages import PERMISSION_ERR_MSG, REQUIRED_FIELD_MSG
from tests.mock_serializers import ProjectRetrieveMockSerializer, ProjectStatisticsMockSerializer
from tests.test_api.v1.test_role_endpoints import TestRoleEndpoints
from testy.core.choices import AccessRequestStatus
from testy.core.models import AccessRequest, Project
from testy.core.selectors.project_settings import ProjectSettings
from testy.tests_description.models import TestCase
from testy.tests_representation.choices import TestStatuses
from testy.tests_representation.models import Parameter, TestResult
from testy.users.models import Membership


@pytest.mark.django_db
class TestProjectEndpoints:
    view_name_list = 'api:v1:project-list'
    view_name_detail = 'api:v1:project-detail'
    view_name_progress = 'api:v1:project-progress'
    view_name_statistics = 'api:v1:project-statistics'
    view_name_access = 'api:v1:project-access'

    @pytest.mark.django_db(reset_sequences=True)
    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_list(self, api_client, authorized_superuser, project_factory, create_file, extension):
        instances = [project_factory() for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)]
        expected_instances = model_to_dict_via_serializer(
            instances,
            many=True,
            serializer_class=ProjectStatisticsMockSerializer,
            requested_user=authorized_superuser,
        )
        actual = api_client.send_request(self.view_name_list).json()['results']
        assert actual == expected_instances

    def test_retrieve(self, api_client, authorized_superuser, project):
        expected_dict = model_to_dict_via_serializer(
            project,
            ProjectRetrieveMockSerializer,
            requested_user=authorized_superuser,
        )
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': project.pk})
        actual_dict = response.json()
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
            format='multipart',
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
            'icon': create_file,
        }
        api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': project.pk},
            request_type=RequestType.PATCH,
            data=project_dict,
            format='multipart',
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
            format='multipart',
        )
        assert not os.path.isfile(icon_path)

    @pytest.mark.parametrize(
        'expected_status, extension',
        [(HTTPStatus.OK, '.jpeg'), (HTTPStatus.BAD_REQUEST, '.jpeg')],
    )
    def test_update(self, api_client, authorized_superuser, project, expected_status, create_file, extension):
        new_name = 'new_name'
        project_dict = {
            'id': project.id,
            'icon': create_file,
        }
        if expected_status == HTTPStatus.OK:
            project_dict['name'] = new_name
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': project.pk},
            request_type=RequestType.PUT,
            expected_status=expected_status,
            data=project_dict,
            format='multipart',
        )
        if expected_status == HTTPStatus.OK:
            instance = Project.objects.get(pk=project.id)
            actual_name = instance.name
            icon_path = instance.icon.path
            assert os.path.isfile(icon_path)
            assert actual_name == new_name, f'Project name do not match. Expected name "{actual_name}", ' \
                                            f'actual: "{new_name}"'
        else:
            assert response.json()['name'][0] == REQUIRED_FIELD_MSG

    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_delete(self, api_client, authorized_superuser, project_factory, create_file, extension):
        project = project_factory(icon=create_file)
        assert Project.objects.count() == 1, 'Project was not created'
        icon_path = project.icon.path
        api_client.send_request(
            self.view_name_detail,
            expected_status=HTTPStatus.NO_CONTENT,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': project.pk},
        )
        assert not Project.objects.count(), f'Project with id "{project.id}" was not deleted.'
        assert not os.path.isfile(icon_path), 'Icon was not deleted'

    def test_valid_project_assignation(self, api_client, authorized_superuser, user, test):
        result_dict = {
            'status': TestStatuses.PASSED,
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
    def test_archived_editable_for_admin_only(
        self, api_client, authorized_superuser, project_factory, user,
        request_type,
    ):
        api_client.force_login(user)
        project = project_factory(is_archive=True)
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': project.pk},
            request_type=request_type,
            expected_status=HTTPStatus.FORBIDDEN,
            data={},
        )
        assert response.json()['detail'] == PERMISSION_ERR_MSG

    def test_ordering_filter(self, api_client, authorized_superuser, project_factory):
        projects = [project_factory(is_archive=idx % 2 == 0) for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)]
        filter_values = ['name', 'is_archive']
        for filter_value in filter_values:  # noqa: WPS426
            projects.sort(key=lambda p: getattr(p, filter_value))
            content = api_client.send_request(
                self.view_name_list,
                query_params={'ordering': filter_value, 'is_archive': 'true'},
            ).json()
            assert content['count'] == constants.NUMBER_OF_OBJECTS_TO_CREATE
            for instance, json_instance in zip(projects, content['results']):
                assert getattr(instance, filter_value) == json_instance[filter_value]

    def test_favorites_filter(self, api_client, authorized_superuser, project_factory):
        for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            project_factory(name=str(idx))
        favorite_ids = Project.objects.filter(name__in=['3', '5']).values_list('id', flat=True)
        not_favorite_ids = Project.objects.filter(~Q(name__in=['3', '5'])).values_list('id', flat=True)
        user_config = {
            'projects': {
                'favorite': list(favorite_ids),
            },
        }
        authorized_superuser.config = user_config
        authorized_superuser.save()
        actual_projects = api_client.send_request(
            self.view_name_list,
            query_params={'favorites': False},
        ).json()['results']
        actual_ids = [project['id'] for project in actual_projects]
        expected_ids = list(deepcopy(favorite_ids))
        expected_ids.extend(list(not_favorite_ids))
        assert actual_ids == expected_ids
        actual_projects = api_client.send_request(
            self.view_name_list,
            query_params={'favorites': True},
        ).json()['results']
        actual_ids = [project['id'] for project in actual_projects]
        assert actual_ids == list(favorite_ids)
        actual_projects = api_client.send_request(
            self.view_name_list,
            query_params={'favorites': False, 'ordering': '-name'},
        ).json()['results']
        actual_ids = [project['id'] for project in actual_projects]
        expected_ids = list(deepcopy(favorite_ids.order_by('-name')))
        expected_ids.extend(list(not_favorite_ids.order_by('-name')))
        assert actual_ids == expected_ids

    def test_search_by_name(self, api_client, authorized_superuser, project_factory):
        projects = [project_factory() for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)]
        filter_values_to_count = [
            (constants.PROJECT_NAME, constants.NUMBER_OF_OBJECTS_TO_CREATE),
            (projects[0].name, 1),
            (projects[1].name, 1),
        ]
        for filter_value, expected_number_of_objects in filter_values_to_count:
            actual_objects_count = api_client.send_request(
                self.view_name_list,
                query_params={'name': filter_value},
            ).json()['count']
            assert expected_number_of_objects == actual_objects_count

    @pytest.mark.django_db(reset_sequences=True)
    @pytest.mark.parametrize(
        'data_fixture_name',
        [
            'multiple_plans_data_project_statistics',
            'result_filter_data_project_statistics',
            'data_different_statuses_project_statistics',
            'empty_plan_data_project_statistics',
        ],
    )
    def test_project_progress(
        self,
        api_client,
        authorized_superuser,
        project,
        data_fixture_name,
        request,
    ):
        expected, start_date, end_date = request.getfixturevalue(data_fixture_name)

        response = api_client.send_request(
            self.view_name_progress,
            reverse_kwargs={'pk': project.pk},
            query_params={
                'start_date': start_date,
                'end_date': end_date,
            },
            expected_status=HTTPStatus.OK,
        )
        results = response.json()
        assert results.sort(key=itemgetter('id')) == expected.sort(key=itemgetter('id'))

    @pytest.mark.parametrize(
        'query_params',
        [
            {'start_date': timezone.datetime(2000, 1, 1)},
            {'end_date': timezone.datetime(2000, 1, 1)},
        ],
        ids=['only start provided', 'only end provided'],
    )
    def test_default_filter_period(
        self,
        api_client,
        project,
        authorized_superuser,
        query_params,
        test_plan_factory,
        test_factory,
        test_result_factory,
    ):
        with mock.patch(
            'django.utils.timezone.now',
            return_value=timezone.make_aware(timezone.datetime(2000, 1, 2), timezone.utc),
        ):
            plan = test_plan_factory(project=project)
            test_result_factory(test=test_factory(plan=plan))

        response = api_client.send_request(
            self.view_name_progress,
            reverse_kwargs={'pk': project.pk},
            expected_status=HTTPStatus.OK,
            query_params=query_params,
        )
        assert response.json(), 'Info about plan was not included in response.'

    def test_settings_default_values(self, api_client, authorized_superuser, project_factory):
        project = project_factory(settings={})
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': project.pk})
        actual_dict = response.json()
        project_settings = ProjectSettings()
        assert actual_dict['settings']['is_result_editable'] == project_settings.is_result_editable
        assert actual_dict['settings']['result_edit_limit'] == WorkTimeProcessor.format_duration(
            project_settings.result_edit_limit, to_workday=False,
        )

    def test_is_visible_annotation(
        self,
        project_factory,
        membership_factory,
        authorized_client,
        user,
        member,
    ):
        expected_number_of_visible = 5
        expected_number_of_not_visible = 5
        for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            if idx % 2 == 0:
                membership_factory(
                    project=project_factory(is_private=True),
                    user=user,
                    role=member,
                )
                continue
            project_factory(is_private=True)

        projects_response = authorized_client.send_request(self.view_name_list).json()['results']
        visible_projects = list(filter(lambda project: project.get('is_visible'), projects_response))
        invisible_projects = list(filter(lambda project: not project.get('is_visible'), projects_response))
        assert len(visible_projects) == expected_number_of_visible
        assert len(invisible_projects) == expected_number_of_not_visible

    def test_is_manageable(self, project, authorized_client, user, role, admin):
        assert not authorized_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': project.pk},
        ).json()['is_manageable']
        Membership.objects.create(
            role=role,
            user=user,
            project=project,
        )
        assert not authorized_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': project.pk},
        ).json()['is_manageable']
        Membership.objects.create(
            role=admin,
            user=user,
            project=project,
        )
        assert authorized_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': project.pk},
        ).json()['is_manageable']

    def test_access_request(
        self,
        project_factory,
        api_client,
        user_factory,
        admin,
        member,
        membership_factory,
        mock_project_access_email,
    ):
        project = project_factory(is_private=True)
        user_to_request_access = user_factory()
        admin_user = user_factory()
        admin_user_spb = user_factory()
        membership_factory(project=project, role=admin, user=admin_user)
        membership_factory(project=project, role=admin, user=admin_user_spb)
        api_client.force_login(user_to_request_access)
        api_client.send_request(
            self.view_name_access,
            data={'reason': 'I need access to your glorious project!'},
            request_type=RequestType.POST,
            reverse_kwargs={'pk': project.pk},
        )
        assert mock_project_access_email.called_with(recipients=[admin_user.email, admin_user_spb.email])
        api_client.force_login(admin_user)
        api_client.send_request(
            TestRoleEndpoints.view_name_assign,
            data={'project': project.pk, 'roles': [member.pk], 'user': user_to_request_access.pk},
            request_type=RequestType.POST,
        )
        assert AccessRequest.objects.first().status == AccessRequestStatus.RESOLVED

    def test_access_request_forbidden(
        self,
        project_factory,
        authorized_client,
        user_factory,
        membership_factory,
        member,
    ):
        user_with_access = user_factory()
        project = project_factory(is_private=True)
        membership_factory(project=project, user=user_with_access, role=member)
        authorized_client.send_request(
            self.view_name_access,
            data={'reason': 'I need access to your glorious project!'},
            request_type=RequestType.POST,
            reverse_kwargs={'pk': project.pk},
        )
        authorized_client.send_request(
            self.view_name_access,
            data={'reason': 'I need access to your glorious project!'},
            request_type=RequestType.POST,
            reverse_kwargs={'pk': project.pk},
            expected_status=HTTPStatus.BAD_REQUEST,
            additional_error_msg='User could send duplicate request',
        )
        authorized_client.force_login(user_with_access)
        authorized_client.send_request(
            self.view_name_access,
            data={'reason': 'I need access to your glorious project!'},
            request_type=RequestType.POST,
            reverse_kwargs={'pk': project.pk},
            expected_status=HTTPStatus.BAD_REQUEST,
            additional_error_msg='User could send duplicate request',
        )

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
from contextlib import contextmanager
from http import HTTPStatus

import allure
import pytest
from django.contrib.contenttypes.models import ContentType

from tests.commons import RequestType
from tests.test_api.v1.test_project_endpoints import TestProjectEndpoints
from tests.test_api.v1.test_testresult_endpoints import TestResultEndpoints
from testy.core.models import Project
from testy.tests_representation.models import TestResult
from testy.users.choices import UserAllowedPermissionCodenames
from testy.users.models import Membership, Role, User
from testy.users.selectors.permissions import PermissionSelector


@pytest.mark.django_db
class TestRolePermissions:
    view_name_list = 'api:v1:role-list'
    view_name_detail = 'api:v1:role-detail'
    view_name_assign = 'api:v1:role-assign'
    view_name_unassign = 'api:v1:role-unassign'

    def test_project_forbidden_actions(
        self,
        project_factory,
        authorized_client,
        user,
        admin,
        role_factory,
    ):
        private_project = project_factory(is_private=True)
        role_no_perms = role_factory()
        with self._role(private_project, user, role_no_perms):
            authorized_client.send_request(
                TestProjectEndpoints.view_name_detail,
                reverse_kwargs={'pk': private_project.pk},
                expected_status=HTTPStatus.FORBIDDEN,
            )
            for request_type in (RequestType.PUT, RequestType.PATCH, RequestType.GET):
                authorized_client.send_request(
                    TestProjectEndpoints.view_name_detail,
                    reverse_kwargs={'pk': private_project.pk},
                    request_type=request_type,
                    expected_status=HTTPStatus.FORBIDDEN,
                    additional_error_msg=f'Validation failed for {request_type.value}',
                )

    def test_private_project_allowed_actions(self, project_factory, authorized_client, user, admin):
        private_project = project_factory(is_private=True)
        with self._role(private_project, user, admin):
            authorized_client.send_request(
                TestProjectEndpoints.view_name_detail,
                reverse_kwargs={'pk': private_project.pk},
            )
            for request_type in (RequestType.PUT, RequestType.PATCH, RequestType.GET):
                authorized_client.send_request(
                    TestProjectEndpoints.view_name_detail,
                    reverse_kwargs={'pk': private_project.pk},
                    request_type=request_type,
                    data={'name': 'New name'},
                )
            authorized_client.send_request(
                TestProjectEndpoints.view_name_detail,
                reverse_kwargs={'pk': private_project.pk},
                request_type=RequestType.DELETE,
                expected_status=HTTPStatus.NO_CONTENT,
            )

    @pytest.mark.parametrize(
        'model_name, factory_name, request_types',
        [
            (
                'testsuite', 'test_suite_factory',
                [RequestType.PATCH, RequestType.PUT, RequestType.DELETE, RequestType.GET],
            ),
            ('testcase', 'test_case_factory', [RequestType.PUT, RequestType.DELETE, RequestType.GET]),
            (
                'testplan', 'test_plan_factory',
                [RequestType.PATCH, RequestType.PUT, RequestType.DELETE, RequestType.GET],
            ),
            ('label', 'label_factory', [RequestType.PATCH, RequestType.PUT, RequestType.DELETE, RequestType.GET]),
        ],
        ids=[
            'Test suite permissions',
            'Test case permissions',
            'Test plan permissions',
            'Label permissions',
        ],
    )
    def test_private_project_forbidden_actions(
        self,
        role_factory,
        project_factory,
        authorized_client,
        user,
        model_name,
        factory_name,
        request,
        request_types,
    ):
        view_name_detail = f'api:v1:{model_name}-detail'
        view_name_list = f'api:v1:{model_name}-list'
        project = project_factory(is_private=True)
        factory = request.getfixturevalue(factory_name)
        instance = factory(is_private=True) if model_name == 'project' else factory(project=project)
        role_no_perms = role_factory()

        with self._role(project, user, role_no_perms):
            for request_type in request_types:
                authorized_client.send_request(
                    view_name=view_name_detail,
                    reverse_kwargs={'pk': instance.pk},
                    request_type=request_type,
                    expected_status=HTTPStatus.FORBIDDEN,
                    additional_error_msg=f'Validation failed for detailed action with request {request_type.value}',
                )

            for request_type in (RequestType.POST, RequestType.GET):
                authorized_client.send_request(
                    view_name=view_name_list,
                    request_type=request_type,
                    expected_status=HTTPStatus.FORBIDDEN,
                    data={'project': project.pk} if request_type == RequestType.POST else None,
                    query_params={'project': project.pk} if request_type == RequestType.GET else None,
                    additional_error_msg=f'Validation failed for list action with request {request_type.value}',
                )

    def test_result_permissions(
        self,
        project_factory,
        test_result_factory,
        test_factory,
        role_factory,
        user,
        authorized_client,
    ):
        project = project_factory(is_private=True)
        test = test_factory(project=project)
        instance = test_result_factory(project=project, test=test)
        role_no_perms = role_factory()

        with self._role(project, user, role_no_perms):
            for request_type in (RequestType.PATCH, RequestType.PUT, RequestType.DELETE, RequestType.GET):
                authorized_client.send_request(
                    view_name=TestResultEndpoints.view_name_detail,
                    reverse_kwargs={'pk': instance.pk},
                    request_type=request_type,
                    expected_status=HTTPStatus.FORBIDDEN,
                    additional_error_msg=f'Validation failed for detailed action with request {request_type.value}',
                )

            authorized_client.send_request(
                view_name=TestResultEndpoints.view_name_list,
                request_type=RequestType.POST,
                expected_status=HTTPStatus.FORBIDDEN,
                data={'test': instance.test.pk},
            )
            authorized_client.send_request(
                view_name=TestResultEndpoints.view_name_list,
                request_type=RequestType.GET,
                expected_status=HTTPStatus.FORBIDDEN,
                query_params={'test': instance.test.pk},
            )

    @pytest.mark.parametrize(
        'model_name, factory_name, request_types',
        [
            (
                'testsuite', 'test_suite_factory',
                [RequestType.PATCH, RequestType.PUT, RequestType.DELETE, RequestType.GET],
            ),
            ('testcase', 'test_case_factory', [RequestType.PUT, RequestType.DELETE, RequestType.GET]),
            (
                'testplan', 'test_plan_factory',
                [RequestType.PATCH, RequestType.PUT, RequestType.DELETE, RequestType.GET],
            ),
            (
                'testresult', 'test_result_factory',
                [RequestType.PATCH, RequestType.PUT, RequestType.DELETE, RequestType.GET],
            ),
            ('label', 'label_factory', [RequestType.PATCH, RequestType.PUT, RequestType.DELETE, RequestType.GET]),
        ],
        ids=[
            'Test suite permissions',
            'Test case permissions',
            'Test plan permissions',
            'Test result permissions',
            'Label permissions',
        ],
    )
    def test_private_project_permissions_allowing_actions(
        self,
        role_factory,
        project_factory,
        authorized_client,
        user,
        model_name,
        factory_name,
        request,
        request_types,
    ):
        view_name_detail = f'api:v1:{model_name}-detail'
        project = project_factory(is_private=True)
        instance = request.getfixturevalue(factory_name)(project=project)
        role_no_perms = role_factory()
        permissions = PermissionSelector.permission_by_codenames(
            [
                f'change_{model_name}',
                f'delete_{model_name}',
                f'add_{model_name}',
                'view_project',
            ],
        )
        role = role_factory(permissions=permissions)
        with self._role(project, user, role_no_perms):
            for request_type in request_types:
                authorized_client.send_request(
                    view_name=view_name_detail,
                    reverse_kwargs={'pk': instance.pk},
                    request_type=request_type,
                    expected_status=HTTPStatus.FORBIDDEN,
                    additional_error_msg=f'Validation failed for {request_type}',
                )

        with self._role(project, user, role):
            for request_type in request_types:
                resp = authorized_client.send_request(
                    view_name=view_name_detail,
                    reverse_kwargs={'pk': instance.pk},
                    request_type=request_type,
                    validate_status=False,
                )
                assert resp.status_code != HTTPStatus.FORBIDDEN

    def test_admin_permissions(self, authorized_client, user, admin, project_factory, user_factory, role, member):
        user_to_assign = user_factory()
        project = project_factory(is_private=True)
        with self._role(project, user, member):
            for forbidden_view_name in [self.view_name_assign, self.view_name_unassign]:
                authorized_client.send_request(
                    forbidden_view_name,
                    request_type=RequestType.POST,
                    expected_status=HTTPStatus.FORBIDDEN,
                    data={
                        'user': user_to_assign.pk,
                        'project': project.pk,
                        'role': role.pk,
                    },
                )
        with self._role(project, user, admin):
            for forbidden_view_name in [self.view_name_assign, self.view_name_unassign]:
                authorized_client.send_request(
                    forbidden_view_name,
                    request_type=RequestType.POST,
                    expected_status=HTTPStatus.OK,
                    data={
                        'user': user_to_assign.pk,
                        'project': project.pk,
                        'roles': [role.pk],
                    },
                )

    def test_multiple_projects_roles(self, authorized_client, user, admin, project_factory, member):
        project_spb = project_factory(is_private=True)
        project_msk = project_factory(is_private=True)
        with self._role(project_spb, user, admin):
            with self._role(project_msk, user, member):
                for project in [project_spb, project_msk]:
                    authorized_client.send_request(
                        TestProjectEndpoints.view_name_detail,
                        reverse_kwargs={'pk': project.pk},
                    )
                authorized_client.send_request(
                    TestProjectEndpoints.view_name_detail,
                    reverse_kwargs={'pk': project_msk.pk},
                    request_type=RequestType.PATCH,
                    data={'name': 'New name'},
                    expected_status=HTTPStatus.FORBIDDEN,
                )
                authorized_client.send_request(
                    TestProjectEndpoints.view_name_detail,
                    reverse_kwargs={'pk': project_spb.pk},
                    request_type=RequestType.PATCH,
                    data={'name': 'New name'},
                    expected_status=HTTPStatus.OK,
                )

    @pytest.mark.parametrize(
        'model_name, factory_name',
        [
            ('project', 'project_factory'),
            ('testsuite', 'test_suite_factory'),
            ('testcase', 'test_case_factory'),
            ('testplan', 'test_plan_factory'),
            ('testresult', 'test_result_factory'),
            ('label', 'label_factory'),
        ],
        ids=[
            'Project suite permissions',
            'Test suite permissions',
            'Test case permissions',
            'Test plan permissions',
            'Test result permissions',
            'Label permissions',
        ],
    )
    def test_public_project_allowed_actions(
        self,
        project,
        authorized_client,
        model_name,
        factory_name,
        request,
    ):
        view_name_detail = f'api:v1:{model_name}-detail'
        view_name_list = f'api:v1:{model_name}-list'
        factory = request.getfixturevalue(factory_name)
        instance = factory() if model_name == 'project' else factory(project=project)
        authorized_client.send_request(
            view_name=view_name_detail,
            reverse_kwargs={'pk': instance.pk},
        )
        authorized_client.send_request(
            view_name=view_name_list,
            query_params={
                'project': project.pk,
                'test': instance.test.pk if isinstance(instance, TestResult) else None,
            },
        )

    @pytest.mark.parametrize(
        'model_name, factory_name, request_types',
        [
            ('testsuite', 'test_suite_factory', [RequestType.PATCH, RequestType.PUT, RequestType.DELETE]),
            ('testcase', 'test_case_factory', [RequestType.PUT, RequestType.DELETE]),
            ('testplan', 'test_plan_factory', [RequestType.PATCH, RequestType.PUT, RequestType.DELETE]),
            ('testresult', 'test_result_factory', [RequestType.PATCH, RequestType.PUT, RequestType.DELETE]),
            ('label', 'label_factory', [RequestType.PATCH, RequestType.PUT, RequestType.DELETE]),
        ],
        ids=[
            'Test suite permissions',
            'Test case permissions',
            'Test plan permissions',
            'Test result permissions',
            'Label permissions',
        ],
    )
    def test_public_project_actions_not_forbidden(
        self,
        project,
        authorized_client,
        model_name,
        factory_name,
        request,
        request_types,
    ):
        view_name_detail = f'api:v1:{model_name}-detail'
        view_name_list = f'api:v1:{model_name}-list'
        factory = request.getfixturevalue(factory_name)
        instance = factory() if model_name == 'project' else factory(project=project)
        payload = None
        if model_name == 'testresult':
            instance.test.project = project
            instance.test.save()
            payload = {'test': instance.test.pk}
        for request_type in request_types:
            resp = authorized_client.send_request(
                view_name=view_name_detail,
                request_type=request_type,
                reverse_kwargs={'pk': instance.pk},
                additional_error_msg=f'Failed validation for {request_type.value} request',
                validate_status=False,
            )
            assert resp.status_code != HTTPStatus.FORBIDDEN
        resp = authorized_client.send_request(
            view_name=view_name_list,
            request_type=RequestType.POST,
            data=payload,
            validate_status=False,
        )
        assert resp.status_code != HTTPStatus.FORBIDDEN

    @pytest.mark.parametrize(
        'model_name, factory_name',
        [
            ('project', 'project_factory'),
            ('testsuite', 'test_suite_factory'),
            ('testcase', 'test_case_factory'),
            ('testplan', 'test_plan_factory'),
            ('testresult', 'test_result_factory'),
            ('label', 'label_factory'),
        ],
        ids=[
            'Project permissions',
            'Test suite permissions',
            'Test case permissions',
            'Test plan permissions',
            'Test result permissions',
            'Label permissions',
        ],
    )
    def test_public_project_external_user_permission(
        self,
        project,
        authorized_client,
        model_name,
        factory_name,
        request,
        role,
        user,
        permission_factory,
        membership_factory,
    ):
        role.permissions.add(
            permission_factory(
                codename=UserAllowedPermissionCodenames.VIEW_PROJECT_RESTRICTION,
                content_type=ContentType.objects.get_for_model(Project),
            ),
        )
        view_name_detail = f'api:v1:{model_name}-detail'
        view_name_list = f'api:v1:{model_name}-list'
        factory = request.getfixturevalue(factory_name)
        instance = factory() if model_name == 'project' else factory(project=project)
        membership_factory(user=user, role=role)
        authorized_client.send_request(
            view_name=view_name_detail,
            reverse_kwargs={'pk': instance.pk},
            expected_status=HTTPStatus.NOT_FOUND if model_name == 'project' else HTTPStatus.FORBIDDEN,
        )
        authorized_client.send_request(
            view_name=view_name_list,
            query_params={
                'project': project.pk,
                'test': instance.test.pk if isinstance(instance, TestResult) else None,
            },
            expected_status=HTTPStatus.OK if model_name == 'project' else HTTPStatus.FORBIDDEN,
        )

    def test_projects_display_for_external_user(
        self,
        authorized_client,
        user,
        role_factory,
        permission_factory,
        membership_factory,
        project_factory,
    ):
        restricting_role = role_factory(
            permissions=[
                permission_factory(
                    codename=UserAllowedPermissionCodenames.VIEW_PROJECT_RESTRICTION,
                    content_type=ContentType.objects.get_for_model(Project),
                ),
            ],
        )
        project_role = role_factory()
        visible_project = project_factory(is_private=True)
        project_factory(is_private=False)
        project_factory(is_private=True)
        membership_factory(user=user, role=restricting_role, project=None)
        membership_factory(user=user, role=project_role, project=visible_project)
        projects = authorized_client.send_request(
            view_name='api:v1:project-list',
            expected_status=HTTPStatus.OK,
        ).json()['results']
        assert len(projects) == 1
        assert projects[0]['id'] == visible_project.pk

    def test_admin_role_added_for_created_user(self, authorized_client, admin):
        authorized_client.send_request(
            TestProjectEndpoints.view_name_list,
            data={'name': 'new_project'},
            request_type=RequestType.POST,
            expected_status=HTTPStatus.CREATED,
        )
        assert Membership.objects.first().role.name == 'Admin'

    @pytest.mark.parametrize(
        'user_role, expected_status',
        [
            ('admin', HTTPStatus.OK), ('role', HTTPStatus.FORBIDDEN), ('superuser', HTTPStatus.OK),
        ],
    )
    def test_is_private_project_update_for_admins_only(
        self,
        project_factory,
        api_client,
        user_factory,
        admin,
        user_role,
        request,
        role_factory,
        expected_status,
    ):
        project = project_factory()
        if user_role == 'superuser':
            user = user_factory(is_superuser=True)
            role = role_factory()
        else:
            user = user_factory()
            role = request.getfixturevalue(user_role)
        api_client.force_login(user)
        with self._role(project, user, role):
            api_client.send_request(
                TestProjectEndpoints.view_name_detail,
                reverse_kwargs={'pk': project.pk},
                data={'is_private': True},
                request_type=RequestType.PATCH,
                expected_status=expected_status,
            )

    def test_admin_cannot_assign_none_or_restricting(
        self,
        api_client,
        admin,
        membership_factory,
        user_factory,
        role_factory,
        permission_factory,
    ):
        role = role_factory(
            permissions=[
                permission_factory(
                    codename=UserAllowedPermissionCodenames.VIEW_PROJECT_RESTRICTION,
                    content_type=ContentType.objects.get_for_model(Project),
                ),
            ],
        )
        admin_user = user_factory()
        user = user_factory()
        membership_factory = membership_factory(user=admin_user, role=admin)
        api_client.force_login(admin_user)
        for project in (None, membership_factory.project):
            api_client.send_request(
                self.view_name_assign,
                request_type=RequestType.POST,
                expected_status=HTTPStatus.FORBIDDEN,
                data={
                    'user': user.pk,
                    'project': project.pk if project else None,
                    'roles': [role.pk],
                },
            )

    @contextmanager
    def _role(self, project: Project, user: User, role: Role) -> None:
        with allure.step(f'Sending request as user: {user} with role: {role} for {project}'):
            membership = Membership.objects.create(project=project, user=user, role=role)
            try:
                yield
            finally:
                membership.hard_delete()

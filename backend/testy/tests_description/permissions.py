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
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import BasePermission

from testy.core.models import Project
from testy.tests_description.api.v2.serializers import TestCaseCopySerializer, TestSuiteCopySerializer
from testy.tests_description.selectors.cases import TestCaseSelector
from testy.tests_description.selectors.suites import TestSuiteSelector
from testy.users.choices import UserAllowedPermissionCodenames
from testy.users.selectors.roles import RoleSelector

_PROJECT = 'project'


class TestCaseSearchPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        if view.action != 'cases_search':
            return True
        project = get_object_or_404(Project, pk=request.query_params.get(_PROJECT))
        if RoleSelector.public_access(request.user, project):
            return True
        return RoleSelector.project_view_allowed(request.user, project)


class TestCaseDetailReadPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        valid_actions = {'get_tests', 'get_history'}
        if view.action not in valid_actions:
            return True
        if RoleSelector.public_access(request.user, obj.project):
            return True
        return RoleSelector.project_view_allowed(
            user=request.user,
            project=obj.project,
        )


class TestCaseDetailChangePermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        valid_actions = {'restore_case_version'}
        if view.action not in valid_actions:
            return True
        if RoleSelector.public_access(request.user, obj.project):
            return True
        return RoleSelector.action_allowed_for_instance(
            user=request.user,
            project=obj.project,
            permission_code='change_testplan',
        )


class TestCaseCopyPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        if view.action != 'copy_cases':
            return True
        serializer = TestCaseCopySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        is_allowed_list: list[bool] = []
        for case in serializer.validated_data.get('cases', []):
            is_allowed_list.append(
                self.has_object_permission(request, view, TestCaseSelector.case_by_id(case.get('id'))),
            )
        if dst_suite_id := serializer.validated_data.get('dst_suite_id'):
            is_allowed_list.append(
                self.has_object_permission(request, view, dst_suite_id),
            )
        return all(is_allowed_list)


class TestSuiteCopyPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        if view.action != 'copy_suites':
            return True
        serializer = TestSuiteCopySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        is_allowed_list: list[bool] = []
        for suite in serializer.validated_data.get('suites'):
            is_allowed_list.append(
                self.has_object_permission(request, view, TestSuiteSelector().suite_by_id(suite.get('id'))),
            )
        if suite := serializer.validated_data.get('dst_suite_id'):
            is_allowed_list.append(self.has_object_permission(request, view, suite))
        if (project := serializer.validated_data.get('dst_project_id')) and project.is_private:
            is_allowed_list.append(
                RoleSelector.action_allowed_for_instance(
                    user=request.user,
                    project=project,
                    permission_code=UserAllowedPermissionCodenames.VIEW_PROJECT,
                ),
            )
        return all(is_allowed_list)


class TestCaseBulkUpdatePermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        if view.action != 'bulk_update_cases':
            return True
        project = get_object_or_404(Project, pk=request.data.get(_PROJECT))
        if RoleSelector.public_access(request.user, project):
            return True
        return RoleSelector.action_allowed_for_instance(
            user=request.user,
            project=project,
            permission_code='change_testcase',
        )

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
from typing import Protocol

from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import SAFE_METHODS, BasePermission

from testy.core.models import Project
from testy.core.permissions import BaseCreatePermission, BaseUpdatePermission
from testy.core.selectors.projects import ProjectSelector
from testy.tests_representation.choices import ResultStatusType
from testy.tests_representation.selectors.testplan import TestPlanSelector
from testy.users.selectors.roles import RoleSelector


class ProjectAssignable(Protocol):
    project: Project


_PROJECT = 'project'


class TestResultCreatePermission(BaseCreatePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        if view.action != 'create':
            return True
        project = ProjectSelector.project_by_test_id(request.data.get('test'))
        if not project:
            raise ValidationError('Could not retrieve project from test')
        if RoleSelector.public_access(request.user, project):
            return True
        return RoleSelector.create_action_allowed(
            user=request.user,
            project=project,
            model_name='testresult',
        )


class TestResultUpdatePermission(BaseUpdatePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        if view.action not in {'update', 'partial_update'}:
            return True
        new_project = ProjectSelector.project_by_test_id(request.data.get('test'))
        current_project = getattr(obj, _PROJECT, None)
        project = new_project or current_project
        if project is None:
            raise ValidationError('No project found to validate permissions')
        if RoleSelector.public_access(request.user, project):
            return True
        return RoleSelector.action_allowed_for_instance(
            user=request.user,
            project=project,
            permission_code='change_testresult',
        )


class TestPlanCopyPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        if view.action != 'copy_plans':
            return True
        plan_ids = [plan.get('plan') for plan in request.data.get('plans', [])]
        if dst_plan_id := request.data.get('dst_plan'):
            plan_ids.append(dst_plan_id)
        plans = TestPlanSelector.plans_by_ids(plan_ids)
        return all(self.has_add_permission(request, plan) for plan in plans)

    def has_add_permission(self, request, obj):
        if RoleSelector.public_access(request.user, obj.project):
            return True
        return RoleSelector.create_action_allowed(
            user=request.user,
            project=obj.project,
            model_name='testplan',
        )


class TestPlanDetailReadPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        valid_actions = {
            'plan_progress',
            'cases_by_plan',
            'suites_by_plan',
            'labeles_view',
            'activity',
            'descendants_tree',
            'labels_view',
            'get_activity_statuses',
        }
        if view.action not in valid_actions:
            return True
        if RoleSelector.public_access(request.user, obj.project):
            return True
        return RoleSelector.project_view_allowed(
            user=request.user,
            project=obj.project,
        )


class ResultStatusPermission(BasePermission):

    def has_permission(self, request, view):
        conditions = [
            view.action == 'create' and request.data.get('type') == ResultStatusType.SYSTEM,
            view.action == 'delete_permanently',
        ]
        if any(conditions):
            return request.user.is_superuser
        return super().has_permission(request, view)

    def has_object_permission(self, request, view, instance):
        if instance.type == ResultStatusType.SYSTEM:
            return request.user.is_superuser or request.method in SAFE_METHODS
        return super().has_object_permission(request, view, instance)


class BulkUpdateTestsPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        if view.action != 'bulk_update_tests':
            return True
        project = get_object_or_404(Project, pk=request.data.get(_PROJECT))
        if RoleSelector.public_access(request.user, project):
            return True
        return RoleSelector.action_allowed_for_instance(
            user=request.user,
            project=project,
            permission_code='change_test',
        )


class ResultUnionByTestPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        if view.action != 'get_results_and_comments':
            return True
        if RoleSelector.public_access(request.user, obj.project):
            return True
        return RoleSelector.project_view_allowed(request.user, obj.project)

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

from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import BasePermission

from testy.core.models import Attachment, Project
from testy.core.selectors.projects import ProjectSelector
from testy.users.choices import UserAllowedPermissionCodenames
from testy.users.selectors.roles import RoleSelector

_PROJECT = 'project'


class BaseListPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        if view.action not in {'list', 'recovery_list'}:
            return True
        project = get_object_or_404(Project, pk=request.query_params.get(_PROJECT))
        if RoleSelector.public_access(request.user, project):
            return True
        return RoleSelector.project_view_allowed(request.user, project)


class BaseRetrievePermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        if view.action != 'retrieve':
            return True
        project = getattr(obj, _PROJECT, None)
        if project is None:
            raise ValidationError('Could not identify project related to object')
        if RoleSelector.public_access(request.user, project):
            return True
        return RoleSelector.project_view_allowed(
            user=request.user,
            project=project,
        )


class BaseCreatePermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        if view.action != 'create':
            return True
        project = get_object_or_404(Project, pk=request.data.get(_PROJECT))
        if RoleSelector.public_access(request.user, project):
            return True
        return RoleSelector.create_action_allowed(
            user=request.user,
            project=project,
            model_name=view.queryset.model._meta.model_name,
        )


class BaseUpdatePermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        if view.action != 'update':
            return True
        new_project = ProjectSelector.project_by_id(request.data.get(_PROJECT))
        current_project = getattr(obj, _PROJECT, None)
        project = new_project or current_project
        if project is None:
            raise ValidationError('No project found to validate permissions')
        if RoleSelector.public_access(request.user, project):
            return True
        return RoleSelector.action_allowed_for_instance(
            user=request.user,
            project=project,
            permission_code=f'change_{type(obj)._meta.model_name}',  # noqa: WPS237
        )


class BasePartialUpdatePermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        if view.action != 'partial_update':
            return True
        new_project = ProjectSelector.project_by_id(request.data.get(_PROJECT))
        current_project = getattr(obj, _PROJECT, None)
        project = new_project or current_project
        if project is None:
            raise ValidationError('No project found to validate permissions')
        if RoleSelector.public_access(request.user, project):
            return True
        return RoleSelector.action_allowed_for_instance(
            user=request.user,
            project=project,
            permission_code=f'change_{type(obj)._meta.model_name}',  # noqa: WPS237
        )


class BaseDestroyPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        if view.action != 'destroy':
            return True
        project = getattr(obj, _PROJECT, None)
        if project is None:
            raise ValidationError('No project found to validate permissions')
        if RoleSelector.public_access(request.user, project):
            return True
        return RoleSelector.action_allowed_for_instance(
            user=request.user,
            project=project,
            permission_code=f'delete_{type(obj)._meta.model_name}',  # noqa: WPS237
        )


class ProjectRetrievePermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        if view.action != 'retrieve':
            return True
        if RoleSelector.public_access(request.user, obj):
            return True
        return RoleSelector.project_view_allowed(
            user=request.user,
            project=obj,
        )


class ProjectUpdatePermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        if view.action not in {'update', 'partial_update'}:
            return True
        if obj.is_private or request.data.get('is_private'):
            return RoleSelector.action_allowed_for_instance(
                request.user,
                obj,
                UserAllowedPermissionCodenames.CHANGE_PROJECT,
            )
        return True


class ProjectDetailReadPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        valid_actions = {'members', 'testplans_by_project', 'parameters_by_project', 'icon', 'project_progress'}
        if view.action not in valid_actions:
            return True
        if RoleSelector.public_access(request.user, obj):
            return True
        return RoleSelector.project_view_allowed(
            user=request.user,
            project=obj,
        )


class AttachmentReadPermission(BasePermission):
    def has_permission(self, request, view):  # noqa: WPS212
        if request.user.is_superuser:
            return True
        attachment = get_object_or_404(Attachment, **view.kwargs)
        if RoleSelector.public_access(request.user, attachment.project):
            return True
        return RoleSelector.project_view_allowed(
            user=request.user,
            project=attachment.project,
        )


BASE_PERMISSIONS = (
    BaseCreatePermission,
    BaseListPermission,
    BaseRetrievePermission,
    BaseUpdatePermission,
    BasePartialUpdatePermission,
    BaseDestroyPermission,
)

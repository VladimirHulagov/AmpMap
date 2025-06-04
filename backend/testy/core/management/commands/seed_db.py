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

import logging
import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.management.base import BaseCommand
from django.core.validators import validate_email

from testy.core.choices import ActionCode
from testy.core.models import NotificationSetting, Project
from testy.users.choices import RoleTypes, UserAllowedPermissionCodenames
from testy.users.models import Role

logger = logging.getLogger(__name__)
UserModel = get_user_model()
_ACTION_CODE = 'action_code'
_VERBOSE_NAME = 'verbose_name'
_PLACEHOLDER_TEXT = 'placeholder_text'
_PLACEHOLDER_LINK = 'placeholder_link'
_MESSAGE = 'message'


class Command(BaseCommand):
    help = 'Seeding default values in database: default superuser.'

    def handle(self, *args, **options) -> None:
        self.create_default_superuser()
        self.create_custom_permissions()
        self.create_default_roles()
        self.create_default_notification_settings()

    @classmethod
    def create_default_notification_settings(cls):
        fields = [_ACTION_CODE, _MESSAGE, _VERBOSE_NAME, _PLACEHOLDER_LINK, _PLACEHOLDER_TEXT]
        settings_data = [
            {
                _ACTION_CODE: ActionCode.TEST_ASSIGNED,
                _MESSAGE: '{{{{placeholder}}}} was assigned to you by {actor}',
                _VERBOSE_NAME: 'Test assigned',
                _PLACEHOLDER_LINK: '/projects/{project_id}/plans/{plan_id}?test={object_id}',
                _PLACEHOLDER_TEXT: 'Test {name}',
            },
            {
                _ACTION_CODE: ActionCode.TEST_UNASSIGNED,
                _MESSAGE: '{{{{placeholder}}}} was unassigned by {actor}',
                _VERBOSE_NAME: 'Test unassigned',
                _PLACEHOLDER_LINK: '/projects/{project_id}/plans/{plan_id}?test={object_id}',
                _PLACEHOLDER_TEXT: 'Test {name}',
            },
            {
                _ACTION_CODE: ActionCode.TEST_BULK_UPDATE,
                _MESSAGE: 'Bulk update was ended {{{{placeholder}}}}',
                _VERBOSE_NAME: 'Bulk update',
            },
        ]
        for data in settings_data:
            instance = NotificationSetting.objects.filter(pk=data[_ACTION_CODE]).first()
            if instance is None:
                NotificationSetting.model_create(fields, data)
                updated = True
            else:
                _, updated = instance.model_update(fields, data)
            if updated:
                logger.info(f'Successfully modified notify action: {data["verbose_name"]}')
            else:
                logger.info(f'Skipping creating notify action: {data["verbose_name"]}')

    @classmethod
    def create_default_superuser(cls) -> None:
        username = os.environ.get('SUPERUSER_USERNAME', '')
        password = os.environ.get('SUPERUSER_PASSWORD', '')
        company_domain = settings.COMPANY_DOMAIN

        if not all([username, password, company_domain]):
            raise ImproperlyConfigured('Some of required parameters were not provided.')

        email = '{0}@{1}'.format(username, company_domain)
        try:
            validate_email(email)
        except ValidationError as err:
            raise ImproperlyConfigured(str(err))

        if UserModel.objects.exists():
            logger.info('Not creating default superuser')
        else:
            logger.info('Creating default superuser')
            UserModel.objects.create_superuser(username, email, password)
            logger.info(f'Default superuser created:\nusername:{username}\nemail: {email}\n')

    @classmethod
    def create_custom_permissions(cls) -> None:
        permissions_to_create = [
            ('Restricted project view', 'project_restricted', ContentType.objects.get_for_model(Project)),
        ]
        for name, codename, ct in permissions_to_create:
            created_role, is_created = Permission.objects.get_or_create(name=name, codename=codename, content_type=ct)
            if not is_created:
                logger.warning(f'Skipping creating permission: {created_role.name}')
                continue
            logger.info(f'Successfully created permission: {created_role.name}')

    @classmethod
    def create_default_roles(cls) -> None:
        default_roles = [
            (
                'User',
                [
                    UserAllowedPermissionCodenames.VIEW_PROJECT,
                    UserAllowedPermissionCodenames.ADD_CASE,
                    UserAllowedPermissionCodenames.ADD_SUITE,
                    UserAllowedPermissionCodenames.CHANGE_CASE,
                    UserAllowedPermissionCodenames.CHANGE_SUITE,
                    UserAllowedPermissionCodenames.ADD_PLAN,
                    UserAllowedPermissionCodenames.CHANGE_PLAN,
                    UserAllowedPermissionCodenames.DELETE_PLAN,
                    UserAllowedPermissionCodenames.DELETE_SUITE,
                    UserAllowedPermissionCodenames.DELETE_CASE,
                    UserAllowedPermissionCodenames.ADD_RESULT,
                    UserAllowedPermissionCodenames.CHANGE_RESULT,
                    UserAllowedPermissionCodenames.DELETE_RESULT,
                    UserAllowedPermissionCodenames.ADD_LABEL,
                    UserAllowedPermissionCodenames.CHANGE_LABEL,
                    UserAllowedPermissionCodenames.DELETE_LABEL,

                    UserAllowedPermissionCodenames.ADD_STATUS,
                    UserAllowedPermissionCodenames.CHANGE_STATUS,
                    UserAllowedPermissionCodenames.DELETE_STATUS,
                    UserAllowedPermissionCodenames.ADD_ATTACHMENT,
                    UserAllowedPermissionCodenames.CHANGE_ATTACHMENT,
                    UserAllowedPermissionCodenames.DELETE_ATTACHMENT,
                    UserAllowedPermissionCodenames.ADD_TEST,
                    UserAllowedPermissionCodenames.CHANGE_TEST,
                    UserAllowedPermissionCodenames.DELETE_TEST,
                    UserAllowedPermissionCodenames.ADD_ATTRIBUTE,
                    UserAllowedPermissionCodenames.CHANGE_ATTRIBUTE,
                    UserAllowedPermissionCodenames.DELETE_ATTRIBUTE,
                ],
            ),
            (
                'Admin', [
                    UserAllowedPermissionCodenames.CHANGE_PROJECT,
                    UserAllowedPermissionCodenames.VIEW_PROJECT,
                    UserAllowedPermissionCodenames.CHANGE_CASE,
                    UserAllowedPermissionCodenames.CHANGE_SUITE,
                    UserAllowedPermissionCodenames.CHANGE_PLAN,
                    UserAllowedPermissionCodenames.CHANGE_RESULT,
                    UserAllowedPermissionCodenames.ADD_PLAN,
                    UserAllowedPermissionCodenames.ADD_SUITE,
                    UserAllowedPermissionCodenames.ADD_CASE,
                    UserAllowedPermissionCodenames.ADD_ROLE,
                    UserAllowedPermissionCodenames.ADD_RESULT,
                    UserAllowedPermissionCodenames.DELETE_PLAN,
                    UserAllowedPermissionCodenames.DELETE_SUITE,
                    UserAllowedPermissionCodenames.DELETE_CASE,
                    UserAllowedPermissionCodenames.DELETE_PROJECT,
                    UserAllowedPermissionCodenames.DELETE_RESULT,
                    UserAllowedPermissionCodenames.ADD_LABEL,
                    UserAllowedPermissionCodenames.CHANGE_LABEL,
                    UserAllowedPermissionCodenames.DELETE_LABEL,

                    UserAllowedPermissionCodenames.ADD_STATUS,
                    UserAllowedPermissionCodenames.CHANGE_STATUS,
                    UserAllowedPermissionCodenames.DELETE_STATUS,
                    UserAllowedPermissionCodenames.ADD_ATTACHMENT,
                    UserAllowedPermissionCodenames.CHANGE_ATTACHMENT,
                    UserAllowedPermissionCodenames.DELETE_ATTACHMENT,
                    UserAllowedPermissionCodenames.ADD_TEST,
                    UserAllowedPermissionCodenames.CHANGE_TEST,
                    UserAllowedPermissionCodenames.DELETE_TEST,
                    UserAllowedPermissionCodenames.ADD_ATTRIBUTE,
                    UserAllowedPermissionCodenames.CHANGE_ATTRIBUTE,
                    UserAllowedPermissionCodenames.DELETE_ATTRIBUTE,
                ],
            ),
            (
                'External user', [
                    UserAllowedPermissionCodenames.VIEW_PROJECT_RESTRICTION,
                ],
            ),
        ]

        for name, codenames in default_roles:
            permissions = Permission.objects.filter(codename__in=codenames)
            role_type = RoleTypes.SUPERUSER_ONLY if name == 'External user' else RoleTypes.SYSTEM
            created_role, is_created = Role.objects.get_or_create(name=name, type=role_type)
            role_difference = (
                permissions.difference(created_role.permissions.all()).exists()
                or created_role.permissions.difference(permissions).exists()
            )
            if not is_created and not role_difference:
                logger.warning(f'Skipping creating role: {created_role.name}')
                continue
            created_role.permissions.set(permissions)
            logger.info(f'Successfully created role: {created_role.name}')

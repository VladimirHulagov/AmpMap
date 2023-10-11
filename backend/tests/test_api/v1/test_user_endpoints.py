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
import io
import json
import os
import time
from copy import deepcopy
from http import HTTPStatus
from pathlib import Path
from typing import Any, Dict

import pytest
from django.conf import settings
from PIL import Image
from rest_framework.reverse import reverse
from rest_framework.test import RequestsClient
from users.api.v1.serializers import UserSerializer
from users.models import User

from tests import constants
from tests.commons import RequestType, model_to_dict_via_serializer
from tests.error_messages import (
    CASE_INSENSITIVE_USERNAME_ALREADY_EXISTS,
    INVALID_EMAIL_MSG,
    REQUIRED_FIELD_MSG,
    UNAUTHORIZED_MSG,
    USERNAME_ALREADY_EXISTS,
)


@pytest.mark.django_db
class TestUserEndpoints:
    view_name_list = 'api:v1:user-list'
    view_name_detail = 'api:v1:user-detail'
    view_name_me = 'api:v1:user-me'
    view_name_config = 'api:v1:user-config'
    view_name_login = 'user-login'
    view_name_logout = 'user-logout'

    def test_list(self, api_client, authorized_superuser, user_factory):
        expected_instances = [model_to_dict_via_serializer(authorized_superuser, UserSerializer)]
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            expected_instances.append(model_to_dict_via_serializer(user_factory(), UserSerializer))
        response = api_client.send_request(self.view_name_list)

        for instance_dict in json.loads(response.content):
            assert instance_dict in expected_instances, f'{instance_dict} was not found in expected instances.'

    def test_retrieve(self, api_client, authorized_superuser, user):
        expected_dict = model_to_dict_via_serializer(user, UserSerializer)
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': user.pk})
        actual_dict = json.loads(response.content)
        assert actual_dict == expected_dict, 'Actual model dict is different from expected'

    def test_me(self, api_client, authorized_superuser):
        expected_dict = model_to_dict_via_serializer(authorized_superuser, UserSerializer)
        response = api_client.send_request(self.view_name_me)
        actual_dict = json.loads(response.content)
        assert actual_dict == expected_dict, 'Actual model dict is different from expected'

    def test_me_config(self, api_client, authorized_superuser):
        config = {
            'custom_attr_1': 'custom1',
            'custom_attr_2': 'custom2',
            'custom_attr_3': 'custom3'
        }
        content = json.loads(api_client.send_request(self.view_name_config).content)
        assert not content, 'Something already in config before it is updated'
        content = json.loads(
            api_client.send_request(
                self.view_name_config,
                data=config,
                request_type=RequestType.PATCH,
            ).content
        )
        assert config == content, 'Config was not update or content did not match'
        new_attr = {'latest_custom_attr': 'custom4'}
        content = json.loads(
            api_client.send_request(
                self.view_name_config,
                data=new_attr,
                request_type=RequestType.PATCH,
            ).content
        )
        config.update(new_attr)
        assert config == content, 'Config was not update or content did not match'

    def test_creation(self, api_client, authorized_superuser):
        expected_users_num = 2
        assert User.objects.count() == 1, 'Extra users were found.'
        user_dict = {
            'username': constants.USERNAME,
            'first_name': constants.FIRST_NAME,
            'last_name': constants.LAST_NAME,
            'password': constants.PASSWORD,
            'email': constants.USER_EMAIL
        }
        api_client.send_request(self.view_name_list, user_dict, HTTPStatus.CREATED, RequestType.POST)
        assert User.objects.count() == expected_users_num, f'Expected number of users "{expected_users_num}"' \
                                                           f'actual: "{User.objects.count()}"'

    @pytest.mark.parametrize(
        "username,new_username,message",
        [
            ('user', 'user', USERNAME_ALREADY_EXISTS),
            ('user', 'UsEr', CASE_INSENSITIVE_USERNAME_ALREADY_EXISTS),
            ('user', 'USER', CASE_INSENSITIVE_USERNAME_ALREADY_EXISTS),
        ]
    )
    def test_duplicate_username_not_allowed(
            self, api_client, authorized_superuser, username, new_username, message
    ):
        expected_users_num = 2
        assert User.objects.count() == 1, 'Extra users were found.'
        user_dict = {
            'username': username,
            'first_name': constants.FIRST_NAME,
            'last_name': constants.LAST_NAME,
            'password': constants.PASSWORD,
            'email': constants.USER_EMAIL
        }
        api_client.send_request(self.view_name_list, user_dict, HTTPStatus.CREATED, RequestType.POST)
        user_dict['username'] = new_username
        response = api_client.send_request(
            self.view_name_list, user_dict, HTTPStatus.BAD_REQUEST, RequestType.POST
        )
        assert json.loads(response.content) == {
            'username': [message]
        }
        assert User.objects.count() == expected_users_num, f'Expected number of users "{expected_users_num}"' \
                                                           f'actual: "{User.objects.count()}"'

    def test_partial_update(self, api_client, authorized_superuser, user):
        new_name = 'new_expected_username'
        user_dict = {
            'id': user.id,
            'username': new_name,
        }
        api_client.send_request(
            self.view_name_detail,
            user_dict,
            request_type=RequestType.PATCH,
            reverse_kwargs={'pk': user.pk}
        )
        actual_name = User.objects.get(pk=user.id).username
        assert actual_name == new_name, f'Username does not match. Expected name "{actual_name}", actual: "{new_name}"'

    @pytest.mark.parametrize('expected_status', [HTTPStatus.OK, HTTPStatus.BAD_REQUEST])
    def test_update(self, api_client, authorized_superuser, user, expected_status):
        new_name = 'new_expected_username'
        user_dict = {
            'id': user.id,
            'username': new_name,
        }
        if expected_status == HTTPStatus.OK:
            user_dict['password'] = user.password
        response = api_client.send_request(
            self.view_name_detail,
            user_dict,
            request_type=RequestType.PUT,
            expected_status=expected_status,
            reverse_kwargs={'pk': user.pk}
        )
        if expected_status == HTTPStatus.OK:
            actual_name = User.objects.get(pk=user.id).username
            assert actual_name == new_name, f'Username does not match. Expected name "{actual_name}", ' \
                                            f'actual: "{new_name}"'
        else:
            assert json.loads(response.content)['password'][0] == REQUIRED_FIELD_MSG

    def test_delete(self, api_client, authorized_superuser, user):
        assert User.objects.count() == 2, 'User was not created'
        api_client.send_request(
            self.view_name_detail,
            expected_status=HTTPStatus.NO_CONTENT,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': user.pk}
        )
        assert User.objects.count() == 1, f'User with id "{user.id}" was not deleted.'

    def test_delete_yourself_is_forbidden(self, api_client, authorized_superuser):
        assert User.objects.count() == 1, "Extra users were detected"
        response = api_client.send_request(
            self.view_name_detail,
            expected_status=HTTPStatus.BAD_REQUEST,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': authorized_superuser.pk}
        )
        content = json.loads(response.content)
        assert content == {'errors': ['User cannot delete itself']}, 'Another error was raised'
        assert User.objects.count() == 1, 'User was deleted by himself'

    def test_unauthorized_access(self, api_client):
        for request_type in RequestType:
            response = api_client.send_request(
                self.view_name_list,
                expected_status=HTTPStatus.UNAUTHORIZED,
                request_type=request_type
            )
            received_dict = json.loads(response.content)
            assert received_dict['detail'] == UNAUTHORIZED_MSG, 'Expected message was not found in response.' \
                                                                f'Request type: {RequestType.POST.value}'

    def test_email_validation(self, api_client, authorized_superuser, user):
        update_types = [RequestType.PUT, RequestType.PATCH]
        user_dict = {
            'username': constants.USERNAME,
            'password': constants.PASSWORD,
            'email': constants.INVALID_EMAIL
        }
        response = api_client.send_request(self.view_name_list, user_dict, HTTPStatus.BAD_REQUEST, RequestType.POST)
        received_dict = json.loads(response.content)
        assert received_dict['email'][0] == INVALID_EMAIL_MSG, 'Validation email error was not found in response.' \
                                                               f'Request type: {RequestType.POST.value}'
        user_dict_update = {
            'username': constants.USERNAME,
            'password': constants.PASSWORD,
            'email': constants.INVALID_EMAIL
        }
        for request_type in update_types:
            response = api_client.send_request(
                self.view_name_detail,
                data=user_dict_update,
                expected_status=HTTPStatus.BAD_REQUEST,
                request_type=request_type,
                reverse_kwargs={'pk': user.pk}
            )
            received_dict = json.loads(response.content)
            assert received_dict['email'][0] == INVALID_EMAIL_MSG, 'Validation email error was not found in response.' \
                                                                   f'Request type: {request_type.value}'

    @pytest.mark.django_db(transaction=True)
    def test_cookie_auth(self, user):
        client = RequestsClient()
        response = client.post(f'http://testserver{reverse(self.view_name_login)}',
                               data={'username': user.username, 'password': constants.PASSWORD})
        csrf = response.cookies['csrftoken']
        sessionid = response.cookies['sessionid']
        assert response.status_code == HTTPStatus.OK
        response = client.get(f'http://testserver{reverse(self.view_name_me)}')
        assert response.status_code == HTTPStatus.OK
        response = client.post(f'http://testserver{reverse(self.view_name_logout)}')
        assert response.status_code == HTTPStatus.FORBIDDEN, 'X-CSRFToken header should be essential.'
        response = client.post(f'http://testserver{reverse(self.view_name_logout)}', headers={'X-CSRFToken': csrf})
        assert response.status_code == HTTPStatus.OK
        response = client.get(f'http://testserver{reverse(self.view_name_me)}')
        assert response.status_code == HTTPStatus.UNAUTHORIZED, 'User could get to me page unauthorized'
        client.cookies['csrftoken'] = csrf
        client.cookies['sessionid'] = sessionid
        response = client.get(f'http://testserver{reverse(self.view_name_me)}')
        assert response.status_code == HTTPStatus.UNAUTHORIZED, 'User could use invalidated sessionid/csrftoken'

    @pytest.mark.django_db(transaction=True)
    def test_cookie_auth_time_invalidation(self, settings, user):
        settings.SESSION_COOKIE_AGE = 1
        client = RequestsClient()
        response = client.post(f'http://testserver{reverse(self.view_name_login)}',
                               data={'username': user.username, 'password': constants.PASSWORD})
        assert response.status_code == HTTPStatus.OK
        time.sleep(1)
        response = client.get(f'http://testserver{reverse(self.view_name_me)}')
        assert response.status_code == HTTPStatus.UNAUTHORIZED

    @staticmethod
    def _form_dict_user_model(user: User) -> Dict[str, Any]:
        user_dict = model_to_dict_via_serializer(user, User)
        fields_to_remove = ['is_superuser', 'last_login', 'password', 'user_permissions']
        for field in fields_to_remove:
            user_dict.pop(field)
        user_dict['date_joined'] = user_dict['date_joined'].strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        return user_dict


@pytest.mark.django_db
class TestUserAvatars:
    view_name_list = 'api:v1:user-list'
    view_name_detail = 'api:v1:user-detail'
    view_name_avatar = 'api:v1:user-avatar'
    avatars_file_response_view_name = 'avatar-path'
    avatars_folder = 'avatars'

    @pytest.mark.parametrize('extension', ['.png', '.jpeg'])
    @pytest.mark.django_db(transaction=True)
    def test_file_deleted_after_user_deleted(self, api_client, authorized_superuser, create_file, project, user,
                                             media_directory):
        user_dict = {
            'username': constants.USERNAME,
            'first_name': constants.FIRST_NAME,
            'last_name': constants.LAST_NAME,
            'password': constants.PASSWORD,
            'email': constants.USER_EMAIL,
            'avatar': create_file
        }
        user_id = json.loads(api_client.send_request(
            self.view_name_list,
            data=user_dict,
            request_type=RequestType.POST,
            expected_status=HTTPStatus.CREATED,
            format='multipart'
        ).content)['id']
        expected_numbers_of_files = len(settings.TESTY_THUMBNAIL_RESOLUTIONS) + 1
        files_folder = Path(User.objects.get(pk=user_id).avatar.url).parts[3]
        number_of_objects_in_dir = len(os.listdir(Path(media_directory, self.avatars_folder, files_folder)))
        assert expected_numbers_of_files == number_of_objects_in_dir

    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_existing_thumbnails_used(self, api_client, authorized_superuser, create_file,
                                      media_directory):
        user_dict = {
            'avatar': create_file
        }
        number_of_objects_to_create = len(settings.TESTY_THUMBNAIL_RESOLUTIONS) + 1  # plus 1 for src file
        user_id = User.objects.first().id
        json.loads(
            api_client.send_request(
                self.view_name_avatar,
                data=user_dict,
                request_type=RequestType.POST,
                format='multipart'
            ).content
        )
        files_folder = Path(User.objects.get(pk=user_id).avatar.url).parts[3]
        number_of_objects_in_dir = len(os.listdir(Path(media_directory, self.avatars_folder, files_folder)))
        assert number_of_objects_to_create == number_of_objects_in_dir
        for resolution in settings.TESTY_THUMBNAIL_RESOLUTIONS:
            content = api_client.send_request(
                self.avatars_file_response_view_name,
                reverse_kwargs={'pk': user_id},
                query_params={'width': resolution[0], 'height': resolution[1]},
            ).content
            img = Image.open(io.BytesIO(content))
            assert resolution[0] == img.width, 'width did not match'
            assert number_of_objects_to_create == number_of_objects_in_dir, 'Already existing file was created again.'

    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_avatar_creation_creates_thumbnails(self, api_client, authorized_superuser, create_file, media_directory):
        user_dict = {
            'avatar': create_file
        }
        number_of_objects_to_create = len(settings.TESTY_THUMBNAIL_RESOLUTIONS) + 1  # plus 1 for src file
        user_id = User.objects.first().id
        json.loads(
            api_client.send_request(
                self.view_name_avatar,
                data=user_dict,
                request_type=RequestType.POST,
                format='multipart'
            ).content
        )
        files_folder = Path(User.objects.get(pk=user_id).avatar.url).parts[3]
        attachment_file_path = Path(media_directory, self.avatars_folder, files_folder)
        assert number_of_objects_to_create == len(os.listdir(attachment_file_path))
        test_mod_parameters = [
            (350, None),
            (None, 350),
            (350, 350)
        ]
        for width, height in test_mod_parameters:
            query_params = {}
            if width:
                query_params['width'] = width
            if height:
                query_params['height'] = height
            api_client.send_request(
                self.avatars_file_response_view_name,
                reverse_kwargs={'pk': user_id},
                query_params=query_params,
                expected_status=HTTPStatus.NOT_FOUND
            )

    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_attachments_behaviour_on_file_system_file_delete(self, api_client, authorized_superuser, create_file,
                                                              media_directory):
        user_dict = {
            'avatar': create_file
        }
        number_of_objects_to_create = len(settings.TESTY_THUMBNAIL_RESOLUTIONS) + 1  # plus 1 for src file
        json.loads(
            api_client.send_request(
                self.view_name_avatar,
                data=user_dict,
                request_type=RequestType.POST,
                format='multipart'
            ).content
        )
        user = User.objects.first()
        files_folder = Path(user.avatar.url).parts[3]
        avatar_file_path = Path(media_directory, self.avatars_folder, files_folder)
        assert number_of_objects_to_create == len(os.listdir(avatar_file_path))
        os.remove(user.avatar.path)
        number_of_objects_to_create -= 1
        api_client.send_request(
            self.avatars_file_response_view_name,
            reverse_kwargs={'pk': user.id},
            expected_status=HTTPStatus.NOT_FOUND
        )
        api_client.send_request(
            self.avatars_file_response_view_name,
            reverse_kwargs={'pk': user.id},
            query_params={'width': 32, 'height': 32},
            expected_status=HTTPStatus.NOT_FOUND
        )
        assert number_of_objects_to_create == len(os.listdir(avatar_file_path))

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_files_deleted(self, api_client, authorized_superuser, create_file, media_directory):
        user_dict = {
            'username': constants.USERNAME,
            'first_name': constants.FIRST_NAME,
            'last_name': constants.LAST_NAME,
            'password': constants.PASSWORD,
            'email': constants.USER_EMAIL,
            'avatar': create_file
        }
        user_id = json.loads(api_client.send_request(
            self.view_name_list,
            data=user_dict,
            request_type=RequestType.POST,
            expected_status=HTTPStatus.CREATED,
            format='multipart'
        ).content)['id']
        user = User.objects.get(pk=user_id)
        files_folder = Path(user.avatar.url).parts[3]
        avatar_file_path = Path(media_directory, self.avatars_folder, files_folder)
        number_of_objects_to_create = len(settings.TESTY_THUMBNAIL_RESOLUTIONS) + 1
        assert number_of_objects_to_create == len(os.listdir(avatar_file_path))
        with open(avatar_file_path / 'asdasdasasd.txt', 'x') as file:
            file.write('Cats data again!')
        with open(avatar_file_path / 'asdasdasasd.png', 'x') as file:
            file.write('Cats data again!')
        api_client.send_request(
            self.view_name_detail,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': user.id},
            expected_status=HTTPStatus.NO_CONTENT
        )
        assert len(os.listdir(avatar_file_path)) == 2, 'All related files must be deleted, other should exist.'

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_avatar_removed_on_update(self, api_client, authorized_superuser, create_file, media_directory):
        file2 = deepcopy(create_file)
        user_dict = {
            'avatar': create_file
        }

        json.loads(
            api_client.send_request(
                self.view_name_avatar,
                data=user_dict,
                request_type=RequestType.POST,
                format='multipart'
            ).content
        )
        user = User.objects.first()
        number_of_objects_to_create = len(settings.TESTY_THUMBNAIL_RESOLUTIONS) + 1  # plus 1 for src file
        files_folder = Path(user.avatar.url).parts[3]
        avatar_file_path = Path(media_directory, self.avatars_folder, files_folder)
        old_list_of_files = os.listdir(avatar_file_path)
        assert number_of_objects_to_create == len(old_list_of_files)
        user_dict2 = {
            'avatar': file2
        }
        json.loads(
            api_client.send_request(
                self.view_name_avatar,
                data=user_dict2,
                request_type=RequestType.POST,
                format='multipart'
            ).content
        )
        assert not len(os.listdir(avatar_file_path))

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.parametrize('extension', ['.png', '.jpeg'], ids=['png', 'jpeg'])
    def test_avatar_deletion(self, api_client, authorized_superuser, create_file, media_directory):
        user_dict = {
            'avatar': create_file
        }
        json.loads(
            api_client.send_request(
                self.view_name_avatar,
                data=user_dict,
                request_type=RequestType.POST,
                format='multipart'
            ).content
        )
        user = User.objects.first()
        number_of_objects_to_create = len(settings.TESTY_THUMBNAIL_RESOLUTIONS) + 1  # plus 1 for src file
        files_folder = Path(user.avatar.url).parts[3]
        avatar_file_path = Path(media_directory, self.avatars_folder, files_folder)
        old_list_of_files = os.listdir(avatar_file_path)
        assert number_of_objects_to_create == len(old_list_of_files)
        json.loads(
            api_client.send_request(
                self.view_name_avatar,
                request_type=RequestType.DELETE,
            ).content
        )
        for extension in ['.txt', '.png']:
            with open(avatar_file_path / f'asdasdasasd{extension}', 'x') as file:
                file.write('Cats data again!')
        assert len(os.listdir(avatar_file_path)) == 2
        json.loads(
            api_client.send_request(
                self.view_name_avatar,
                request_type=RequestType.DELETE,
            ).content
        )
        assert len(os.listdir(avatar_file_path)) == 2

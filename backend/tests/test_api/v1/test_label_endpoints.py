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
from core.api.v1.serializers import LabelSerializer
from core.models import Label

from tests import constants
from tests.commons import RequestType, model_to_dict_via_serializer
from tests.error_messages import REQUIRED_FIELD_MSG


@pytest.mark.django_db
class TestLabelEndpoints:
    view_name_list = 'api:v1:label-list'
    view_name_detail = 'api:v1:label-detail'

    def test_list(self, api_client, authorized_superuser, label_factory, project):
        expected_instances = []

        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            expected_instances.append(model_to_dict_via_serializer(label_factory(project=project), LabelSerializer))

        response = api_client.send_request(self.view_name_list, query_params={'project': project.id})

        for instance in json.loads(response.content):
            assert instance in expected_instances

    def test_retrieve(self, api_client, authorized_superuser, label):
        expected_dict = model_to_dict_via_serializer(label, LabelSerializer)
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': label.pk})
        actual_dict = json.loads(response.content)
        assert actual_dict == expected_dict, 'Actual model dict is different from expected'

    def test_creation(self, api_client, authorized_superuser, project):
        expected_labels_num = 1
        assert Label.objects.count() == 0, 'Extra labels were found.'
        label_dict = {
            'name': constants.LABEL_NAME,
            'project': project.pk
        }
        api_client.send_request(self.view_name_list, label_dict, HTTPStatus.CREATED, RequestType.POST)
        assert Label.objects.count() == expected_labels_num, f'Expected number of labels "{expected_labels_num}"' \
            f'actual: "{Label.objects.count()}"'

    def test_creation_case_insensitive(self, api_client, authorized_superuser, project):
        expected_labels_num = 1
        assert Label.objects.count() == 0, 'Extra labels were found.'
        label_lower_dict = {
            'name': constants.LABEL_NAME.lower(),
            'project': project.pk
        }
        api_client.send_request(self.view_name_list, label_lower_dict, HTTPStatus.CREATED, RequestType.POST)
        assert Label.objects.count() == expected_labels_num, f'Expected number of labels "{expected_labels_num}"' \
            f'actual: "{Label.objects.count()}"'

        label_upper_dict = {
            'name': constants.LABEL_NAME.upper(),
            'project': project.pk
        }
        response = api_client.send_request(self.view_name_list, label_upper_dict,
                                           HTTPStatus.BAD_REQUEST, RequestType.POST)
        assert json.loads(response.content)[
            'name'][0] == f'Label {label_upper_dict["name"]} in project {project.name} already exists.'

    def test_partial_update(self, api_client, authorized_superuser, label):
        new_name = 'new_expected_label_name'
        label_dict = {
            'name': new_name,
        }
        api_client.send_request(
            self.view_name_detail,
            label_dict,
            request_type=RequestType.PATCH,
            reverse_kwargs={'pk': label.pk}
        )
        actual_name = Label.objects.get(pk=label.id).name
        assert actual_name == new_name, f'Name does not match. Expected name "{actual_name}", actual: "{new_name}"'

    @pytest.mark.parametrize('expected_status', [HTTPStatus.OK, HTTPStatus.BAD_REQUEST])
    def test_update(self, api_client, authorized_superuser, label, project, expected_status):
        new_name = 'new_expected_label_name'
        user_dict = {
            'name': new_name,
        }
        if expected_status == HTTPStatus.OK:
            user_dict['project'] = project.pk
        response = api_client.send_request(
            self.view_name_detail,
            user_dict,
            request_type=RequestType.PUT,
            expected_status=expected_status,
            reverse_kwargs={'pk': label.pk}
        )
        if expected_status == HTTPStatus.OK:
            actual_name = Label.objects.get(pk=label.id).name
            assert actual_name == new_name, f'Name does not match. Expected name "{actual_name}", ' \
                                            f'actual: "{new_name}"'
        else:
            assert json.loads(response.content)['project'][0] == REQUIRED_FIELD_MSG

    def test_delete(self, api_client, authorized_superuser, label):
        assert Label.objects.count() == 1, 'Label was not created'
        api_client.send_request(
            self.view_name_detail,
            expected_status=HTTPStatus.NO_CONTENT,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': label.pk}
        )
        assert Label.objects.count() == 0, f'Label with id "{label.id}" was not deleted.'

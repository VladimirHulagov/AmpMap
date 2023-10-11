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
from comments.api.v1.serializers import CommentSerializer
from comments.models import Comment

from tests import constants
from tests.commons import RequestType, model_to_dict_via_serializer


@pytest.mark.django_db
class TestCommentEndpoints:
    view_name_list = 'api:v1:comments-list'
    view_name_detail = 'api:v1:comments-detail'

    @pytest.mark.parametrize(
        'factory_name, content_type', [
            ('comment_test_factory', 'test'),
            ('comment_test_case_factory', 'testcase'),
            ('comment_test_result_factory', 'testresult'),
            ('comment_test_suite_factory', 'testsuite'),
            ('comment_test_plan_factory', 'testplan')
        ]
    )
    def test_list(self, api_client, authorized_superuser, factory_name, content_type, request):
        factory = request.getfixturevalue(factory_name)
        instances = [factory() for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)]
        object_id = instances[0].object_id
        expected_instances = model_to_dict_via_serializer(instances, CommentSerializer, many=True)

        content = json.loads(
            api_client.send_request(
                self.view_name_list,
                query_params={
                    'model': content_type,
                    'object_id': object_id
                }
            ).content
        )

        for instance in content['results']:
            assert instance in expected_instances

    @pytest.mark.parametrize(
        'factory_name', [
            'comment_test_factory',
            'comment_test_case_factory',
            'comment_test_result_factory',
            'comment_test_suite_factory',
            'comment_test_plan_factory'
        ]
    )
    def test_retrieve(self, api_client, authorized_superuser, factory_name, request):
        instance = request.getfixturevalue(factory_name)(user=authorized_superuser)
        expected_dict = model_to_dict_via_serializer(instance, CommentSerializer)
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': instance.pk})
        actual_dict = json.loads(response.content)
        assert actual_dict == expected_dict, 'Actual model dict is different from expected'

    @pytest.mark.parametrize(
        'factory_name, content_type', [
            ('test_factory', 'test'),
            ('test_case_factory', 'testcase'),
            ('test_result_factory', 'testresult'),
            ('test_suite_factory', 'testsuite'),
            ('test_plan_factory', 'testplan')
        ]
    )
    def test_creation(self, api_client, authorized_superuser, factory_name, content_type, request):
        instance = request.getfixturevalue(factory_name)()
        assert Comment.objects.count() == 0, 'Extra comments were found.'
        body_dict = {
            'content': constants.TEST_COMMENT,
            'model': content_type,
            'object_id': instance.pk

        }
        api_client.send_request(self.view_name_list, body_dict, HTTPStatus.CREATED, RequestType.POST)
        assert Comment.objects.count() == 1, f'Expected number of labels 1' \
                                             f'actual: "{Comment.objects.count()}"'

    @pytest.mark.parametrize(
        'factory_name', [
            'comment_test_factory',
            'comment_test_case_factory',
            'comment_test_result_factory',
            'comment_test_suite_factory',
            'comment_test_plan_factory'
        ]
    )
    def test_update(self, api_client, authorized_superuser, factory_name, request):
        instance = request.getfixturevalue(factory_name)(user=authorized_superuser)
        new_content = 'new_expected_label_name'
        body_dict = {
            'content': new_content,
        }

        api_client.send_request(
            self.view_name_detail,
            body_dict,
            request_type=RequestType.PUT,
            expected_status=HTTPStatus.OK,
            reverse_kwargs={'pk': instance.pk}
        )

        actual_content = Comment.objects.get(pk=instance.id).content
        assert actual_content == new_content, f'Content does not match. Expected name "{new_content}", ' \
                                              f'actual: "{actual_content}"'

    @pytest.mark.parametrize(
        'factory_name', [
            'comment_test_factory',
            'comment_test_case_factory',
            'comment_test_result_factory',
            'comment_test_suite_factory',
            'comment_test_plan_factory'
        ]
    )
    def test_delete(self, api_client, authorized_superuser, factory_name, request):
        content_after_deletion = 'Comment was deleted'
        instance = request.getfixturevalue(factory_name)(user=authorized_superuser)
        assert Comment.objects.count() == 1, 'Comment was not created'
        api_client.send_request(
            self.view_name_detail,
            expected_status=HTTPStatus.NO_CONTENT,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': instance.pk}
        )
        assert Comment.objects.count() == 1, 'Comment was hard deleted'
        content = json.loads(
            api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': instance.pk}).content
        )
        assert content['content'] == content_after_deletion, 'Comment was not mark as deleted'

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
import re
from http import HTTPStatus
from typing import Any, List, TypeVar, Union

import pytest
from core.models import Attachment, Label, LabeledItem
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models import QuerySet
from tests_description.api.v1.serializers import TestSuiteSerializer, TestSuiteTreeSerializer
from tests_description.models import TestCase, TestCaseStep, TestSuite

from tests import constants
from tests.commons import RequestType, model_to_dict_via_serializer
from tests.error_messages import REQUIRED_FIELD_MSG
from tests.mock_serializers import TestSuiteMockTreeSerializer

_Iterable = TypeVar('_Iterable', bound=Union[List[Any], QuerySet[Any]])
_DMT = TypeVar('_DMT', bound=models.Model)


@pytest.mark.django_db(reset_sequences=True)
class TestSuiteEndpoints:
    view_name_list = 'api:v1:testsuite-list'
    view_name_detail = 'api:v1:testsuite-detail'
    view_name_copy = 'api:v1:suites-copy'

    def test_list(self, api_client, authorized_superuser, test_suite_factory, project):
        expected_instances = []
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            expected_dict = model_to_dict_via_serializer(test_suite_factory(project=project), TestSuiteSerializer)
            expected_dict['test_cases'] = []
            expected_instances.append(expected_dict)

        response = api_client.send_request(self.view_name_list, query_params={'project': project.id})
        for instance_dict in json.loads(response.content)['results']:
            assert instance_dict in expected_instances, f'{instance_dict} was not found in expected instances.'

    def test_retrieve(self, api_client, authorized_superuser, test_suite):
        expected_dict = model_to_dict_via_serializer(test_suite, TestSuiteSerializer)
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': test_suite.pk})
        actual_dict = json.loads(response.content)
        assert actual_dict == expected_dict, 'Actual model dict is different from expected'

    def test_creation(self, api_client, authorized_superuser, project):
        expected_number_of_suites = 1
        suite_dict = {
            'name': constants.TEST_CASE_NAME,
            'project': project.id,
        }
        api_client.send_request(self.view_name_list, suite_dict, HTTPStatus.CREATED, RequestType.POST)
        assert TestSuite.objects.count() == expected_number_of_suites, f'Expected number of users ' \
                                                                       f'"{expected_number_of_suites}"' \
                                                                       f'actual: "{TestSuite.objects.count()}"'

    def test_partial_update(self, api_client, authorized_superuser, test_suite):
        new_name = 'new_expected_test_case_name'
        suite_dict = {
            'id': test_suite.id,
            'name': new_name
        }
        api_client.send_request(
            self.view_name_detail,
            suite_dict,
            request_type=RequestType.PATCH,
            reverse_kwargs={'pk': test_suite.pk}
        )
        actual_name = TestSuite.objects.get(pk=test_suite.id).name
        assert actual_name == new_name, f'Suite names do not match. Expected name "{actual_name}", ' \
                                        f'actual: "{new_name}"'

    @pytest.mark.parametrize('expected_status', [HTTPStatus.OK, HTTPStatus.BAD_REQUEST])
    def test_update(self, api_client, authorized_superuser, expected_status, test_suite, project):
        new_name = 'new_expected_test_case_name'
        suite_dict = {
            'id': test_suite.id,
            'name': new_name
        }
        if expected_status == HTTPStatus.OK:
            suite_dict['project'] = project.id
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_suite.pk},
            request_type=RequestType.PUT,
            expected_status=expected_status,
            data=suite_dict
        )
        if expected_status == HTTPStatus.OK:
            actual_name = TestSuite.objects.get(pk=test_suite.id).name
            assert actual_name == new_name, f'Suite name does not match. Expected name "{actual_name}", ' \
                                            f'actual: "{new_name}"'
        else:
            assert json.loads(response.content)['project'][0] == REQUIRED_FIELD_MSG

    def test_delete(self, api_client, authorized_superuser, test_suite):
        assert TestSuite.objects.count() == 1, 'Test suite was not created'
        api_client.send_request(
            self.view_name_detail,
            expected_status=HTTPStatus.NO_CONTENT,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': test_suite.pk}
        )
        assert not TestSuite.objects.count(), f'Test suite with id "{test_suite.id}" was not deleted.'

    @pytest.mark.parametrize('request_type', [RequestType.PUT, RequestType.PATCH])
    def test_child_parent_logic(self, api_client, authorized_superuser, test_suite_factory, request_type):
        parent = test_suite_factory()
        child = test_suite_factory(parent=parent)
        api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': parent.id},
            data={'parent': child.id},
            request_type=request_type,
            expected_status=HTTPStatus.BAD_REQUEST
        )

    @pytest.mark.parametrize('is_project_specified', [False, True], ids=['Project not specified', 'Project specified'])
    @pytest.mark.parametrize('is_name_specified', [False, True], ids=['New name not specified', 'New name specified'])
    @pytest.mark.parametrize('is_suite_specified', [False, True], ids=['Suite not specified', 'Suite is specified'])
    def test_suites_copy(
        self,
        api_client,
        authorized_superuser,
        test_suite_factory,
        project_factory,
        test_case_factory,
        test_case_with_steps_factory,
        attachment_factory,
        labeled_item_factory,
        is_suite_specified,
        is_project_specified,
        is_name_specified
    ):
        attach_reference = 'Some useful text about cats ![](https://possible-host.com/attachments/{attachment_id}/)'
        replacement_name = 'Suite replacement name'
        source_project = project_factory()
        dst_project = project_factory()
        root_suite = test_suite_factory(project=source_project)
        child_suite = test_suite_factory(project=source_project, parent=root_suite)
        section_1 = test_suite_factory(project=source_project, parent=child_suite)
        section_2 = test_suite_factory(project=source_project, parent=child_suite)
        source_suites = [root_suite, child_suite, section_1, section_2]
        attachments_section_2 = []
        attachments_steps_section_2 = []
        cases_section_1 = [test_case_factory(suite=section_1) for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)]
        cases_section_2 = []
        labels = []
        labeled_items = []
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            case = test_case_with_steps_factory(suite=section_2)
            attachment = attachment_factory(content_object=case)
            case.scenario = attach_reference.format(attachment_id=attachment.id)
            case.save()
            labeled_item = labeled_item_factory(content_object=case)
            labeled_items.append(labeled_item)
            labels.append(labeled_item.label)
            cases_section_2.append(case)
            attachments_section_2.append(attachment)
            for step in case.steps.all():
                attachment = attachment_factory(content_object=step)
                step.expected = attach_reference.format(attachment_id=attachment.id)
                step.save()
                attachments_steps_section_2.append(attachment)

        data = {
            'suites': [{'id': root_suite.id}],
        }
        if is_suite_specified:
            dst_suite = test_suite_factory(project=dst_project)
            data['dst_suite_id'] = dst_suite.id

        if is_project_specified:
            data['dst_project_id'] = dst_project.id

        if is_name_specified:
            data['suites'][0]['new_name'] = replacement_name

        if is_suite_specified and not is_project_specified:
            api_client.send_request(
                self.view_name_copy,
                request_type=RequestType.POST,
                data=data,
                expected_status=HTTPStatus.BAD_REQUEST
            )
            return
        api_client.send_request(
            self.view_name_copy,
            request_type=RequestType.POST,
            data=data
        )
        src_steps = TestCaseStep.objects.filter(test_case__in=[case.id for case in cases_section_2]).order_by('id')

        copied_cases_sec_1 = (
            TestCase.objects
            .filter(suite__name=section_1.name)
            .exclude(pk__in=self.get_ids_from_list(cases_section_1))
            .order_by('id')
        )
        copied_cases_sec_2 = (
            TestCase.objects
            .filter(suite__name=section_2.name)
            .exclude(pk__in=self.get_ids_from_list(cases_section_2))
            .order_by('id')
        )

        copied_attachments_sec_2 = (
            Attachment.objects
            .filter(content_type=ContentType.objects.get_for_model(TestCase))
            .exclude(pk__in=self.get_ids_from_list(attachments_section_2))
            .order_by('id')
        )
        copied_steps = (
            TestCaseStep.objects
            .all()
            .exclude(pk__in=self.get_ids_from_list(src_steps))
            .order_by('id')
        )
        copied_attachments_steps_sec_2 = (
            Attachment.objects
            .filter(content_type=ContentType.objects.get_for_model(TestCaseStep))
            .exclude(pk__in=self.get_ids_from_list(attachments_steps_section_2))
            .order_by('id')
        )
        copied_labels = (
            Label.objects
            .all()
            .exclude(pk__in=self.get_ids_from_list(labels))
            .order_by('id')
        )

        copied_labeled_items = (
            LabeledItem.objects
            .filter(label__in=copied_labels if is_project_specified else labels)
            .exclude(pk__in=self.get_ids_from_list(labeled_items))
            .order_by('id')
        )

        self._validate_copied_objects(
            cases_section_1,
            copied_cases_sec_1,
            changed_attr_names=['id', 'attachments', 'labeled_items', 'suite_id'],
            copied_attr_names=[
                'name', 'setup', 'scenario', 'expected', 'teardown', 'estimate', 'description', 'is_steps'
            ],
            project_id_changed=is_project_specified,
        )

        self._validate_copied_objects(
            cases_section_2,
            copied_cases_sec_2,
            changed_attr_names=['id', 'attachments', 'labeled_items', 'suite_id'],
            copied_attr_names=['name', 'setup', 'expected', 'teardown', 'estimate', 'description', 'is_steps'],
            attach_reference_fields=['scenario'],
            project_id_changed=is_project_specified,
        )

        self._validate_copied_objects(
            attachments_section_2,
            copied_attachments_sec_2,
            changed_attr_names=['id', 'object_id', 'content_object', 'file'],
            copied_attr_names=['name', 'filename', 'file_extension', 'size', 'content_type', 'comment'],
            project_id_changed=is_project_specified,
        )

        self._validate_copied_objects(
            src_steps,
            copied_steps,
            changed_attr_names=['id', 'test_case_id'],
            copied_attr_names=['name', 'scenario', 'sort_order'],
            attach_reference_fields=['expected'],
            project_id_changed=is_project_specified,
        )

        self._validate_copied_objects(
            attachments_steps_section_2,
            copied_attachments_steps_sec_2,
            changed_attr_names=['id', 'object_id', 'content_object', 'file'],
            copied_attr_names=['name', 'filename', 'file_extension', 'size', 'content_type', 'comment'],
            project_id_changed=is_project_specified,
        )

        if is_project_specified:
            self._validate_copied_objects(
                labels,
                copied_labels,
                changed_attr_names=['id'],
                copied_attr_names=['name', 'user', 'type'],
                project_id_changed=is_project_specified,
            )
        else:
            assert len(Label.objects.all()) == constants.NUMBER_OF_OBJECTS_TO_CREATE

        self._validate_copied_objects(
            labeled_items,
            copied_labeled_items,
            changed_attr_names=['id', 'label', 'content_object'] if is_project_specified else ['id', 'content_object'],
            copied_attr_names=['content_type'],
            project_id_changed=is_project_specified,
            skip_project_validation=True,
        )

        copied_suites = TestSuite.objects.all().exclude(pk__in=self.get_ids_from_list(source_suites)).order_by('id')

        if is_name_specified:
            if is_suite_specified:
                copied_suites = copied_suites.exclude(id=dst_suite.id)
            self._validate_copied_objects(
                source_suites[:1],
                copied_suites[:1],
                changed_attr_names=['id', 'name', 'parent', 'tree_id', 'level'],
                copied_attr_names=['description'],
                project_id_changed=is_project_specified
            )
            source_suites = source_suites[1:]
            copied_suites = copied_suites.exclude(id=copied_suites.first().id)

        if is_suite_specified:
            assert len(copied_suites) == len(copied_suites.filter(tree_id=copied_suites[0].tree_id)), \
                'Tree was not rebuild properly'
            copied_suites = copied_suites.exclude(id=dst_suite.id)
            self._validate_copied_objects(
                source_suites,
                copied_suites,
                changed_attr_names=['id', 'parent', 'tree_id', 'level'],
                copied_attr_names=['name', 'description'],
                project_id_changed=is_project_specified
            )
        else:
            self._validate_copied_objects(
                source_suites,
                copied_suites,
                changed_attr_names=['id', 'parent', 'tree_id'],
                copied_attr_names=['name', 'description', 'level'],
                project_id_changed=is_project_specified
            )
            assert len(copied_suites) == len(copied_suites.filter(tree_id=copied_suites[0].tree_id)), \
                'Tree was not rebuild properly'

    @classmethod
    def get_ids_from_list(cls, objs: List[_DMT]):
        return [obj.id for obj in objs]

    @classmethod
    def _validate_copied_objects(
        cls,
        src_objects: _Iterable,
        copied_objects: _Iterable,
        changed_attr_names: List[str],
        copied_attr_names: List[str],
        project_id_changed: bool,
        skip_project_validation: bool = False,
        attach_reference_fields: List[str] = None,
    ):
        pattern = r'Some useful text about cats !\[\]\(https://possible-host\.com/attachments/\d+/\)'
        if not attach_reference_fields:
            attach_reference_fields = []
        if project_id_changed and not skip_project_validation:
            changed_attr_names.append('project_id')
        elif not project_id_changed and not skip_project_validation:
            copied_attr_names.append('project_id')
        assert len(src_objects) == len(copied_objects), 'Both validating objects lengths must be equal'

        for src_obj, copied_obj in zip(src_objects, copied_objects):
            for changed_attr_name in changed_attr_names:
                if not getattr(src_obj, changed_attr_name):
                    continue
                assert getattr(src_obj, changed_attr_name) != getattr(copied_obj, changed_attr_name), \
                    f'{changed_attr_name} has not changed'

            for copied_attr_name in copied_attr_names:
                assert getattr(src_obj, copied_attr_name) == getattr(copied_obj, copied_attr_name), \
                    f'{copied_attr_name} changed'

            for attach_reference_field in attach_reference_fields:
                src_value = getattr(src_obj, attach_reference_field)
                copied_value = getattr(copied_obj, attach_reference_field)
                assert re.match(pattern, src_value) and re.match(pattern, copied_value)
                assert getattr(src_obj, attach_reference_field) != getattr(copied_obj, attach_reference_field), \
                    'Attachment reference was not changed'


@pytest.mark.django_db(reset_sequences=True)
class TestSuiteEndpointsQueryParams:
    view_name_list = 'api:v1:testsuite-list'

    def test_suite_filter(self, api_client, authorized_superuser, test_suite_factory, project_factory):
        projects = [project_factory() for _ in range(3)]
        for _ in range(2):
            for project in projects:
                test_suite_factory(project=project)

        for project in projects:
            suites = TestSuite.objects.filter(project=project.id)
            expected_dict = model_to_dict_via_serializer(suites, serializer_class=TestSuiteSerializer, many=True)
            response = api_client.send_request(
                self.view_name_list,
                expected_status=HTTPStatus.OK,
                request_type=RequestType.GET,
                query_params={'project': project.id}
            )
            actual_dict = json.loads(response.content)['results']
            assert actual_dict == expected_dict, 'Actual and expected dict are different.'

    def test_suite_treeview(self, api_client, authorized_superuser, test_suite_factory, project_factory,
                            test_case_factory):
        projects = [project_factory() for _ in range(3)]

        for _ in range(2):
            for project in projects:
                test_case_factory(suite=test_suite_factory(project=project))

        for project in projects:
            suites = TestSuite.objects.filter(project=project.id)
            for suite in suites:
                setattr(suite, 'cases_count', 1)
                setattr(suite, 'descendant_count', 0)
            expected_dict = model_to_dict_via_serializer(suites, serializer_class=TestSuiteTreeSerializer, many=True)
            incorrect_dict = model_to_dict_via_serializer(suites, serializer_class=TestSuiteSerializer, many=True)
            response = api_client.send_request(
                self.view_name_list,
                expected_status=HTTPStatus.OK,
                request_type=RequestType.GET,
                query_params={'project': project.id, 'treeview': 'True'}
            )
            actual_dict = json.loads(response.content)['results']
            assert actual_dict.sort(key=lambda x: x['id']) == expected_dict.sort(key=lambda x: x['id']), \
                'Actual and expected dict are different.'
            assert actual_dict != incorrect_dict, 'SuiteSerializer is used to output suites with treeview param.'

    @pytest.mark.django_db(reset_sequences=True)
    def test_search(self, api_client, authorized_superuser, test_suite_factory, project):
        root_suite = test_suite_factory(project=project)
        inner_suite = test_suite_factory(project=project, parent=root_suite)
        expected_suites = []
        search_name = 'search_name'
        for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            if idx % 2:
                expected_suites.append(
                    test_suite_factory(parent=inner_suite, name=search_name,
                                       project=project)
                )
            else:
                test_suite_factory(parent=inner_suite, project=project)
        expected_output = model_to_dict_via_serializer(root_suite, TestSuiteMockTreeSerializer,
                                                       fields_to_add={'cases_count': 0})
        inner_dict = model_to_dict_via_serializer(inner_suite, TestSuiteMockTreeSerializer,
                                                  fields_to_add={'cases_count': 0})
        inner_dict['children'] = model_to_dict_via_serializer(expected_suites, TestSuiteMockTreeSerializer, many=True,
                                                              fields_to_add={'cases_count': 0})
        expected_output['children'] = [inner_dict]
        actual_data = json.loads(
            api_client.send_request(
                self.view_name_list,
                query_params={'project': project.id, 'search': search_name, 'treeview': 1}
            ).content
        )['results']
        assert [expected_output] == actual_data, 'Search data does not match expected data.'
        actual_data = json.loads(
            api_client.send_request(
                self.view_name_list,
                query_params={'project': project.id, 'treeview': 1}
            ).content
        )['results']
        assert [expected_output] != actual_data
        actual_data = json.loads(
            api_client.send_request(
                self.view_name_list,
                query_params={
                    'project': project.id,
                    'search': 'non-existent',
                    'treeview': 1
                }
            ).content
        )['results']
        assert not actual_data, 'Non-existent search argument got output.'

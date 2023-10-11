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
import os
import shutil
from http import HTTPStatus
from unittest import mock

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from pytest_factoryboy import register
from tests_representation.choices import TestStatuses
from tests_representation.models import TestResult

from tests import constants
from tests.commons import CustomAPIClient, RequestType
from tests.factories import (
    AttachmentFactory,
    AttachmentTestCaseFactory,
    AttachmentTestResultFactory,
    CommentTestCaseFactory,
    CommentTestFactory,
    CommentTestPlanFactory,
    CommentTestResultFactory,
    CommentTestSuiteFactory,
    GroupFactory,
    LabeledItemFactory,
    LabelFactory,
    ParameterFactory,
    ProjectFactory,
    SystemMessageFactory,
    TestCaseFactory,
    TestCaseWithStepsFactory,
    TestFactory,
    TestPlanFactory,
    TestPlanWithParametersFactory,
    TestResultFactory,
    TestSuiteFactory,
    UserFactory,
)

register(ParameterFactory)
register(ProjectFactory)
register(TestCaseFactory)
register(TestCaseWithStepsFactory, _name='test_case_with_steps')
register(TestFactory)
register(TestPlanFactory)
register(TestPlanWithParametersFactory)
register(TestResultFactory)
register(TestSuiteFactory)
register(UserFactory)
register(GroupFactory)
register(LabelFactory)
register(AttachmentTestCaseFactory, _name='attachment_test_case')
register(AttachmentTestResultFactory, _name='attachment_test_result')
register(AttachmentFactory)
register(LabeledItemFactory)
register(CommentTestFactory)
register(CommentTestCaseFactory)
register(CommentTestSuiteFactory)
register(CommentTestPlanFactory)
register(CommentTestResultFactory)
register(SystemMessageFactory)


@pytest.fixture
def api_client():
    return CustomAPIClient()


@pytest.fixture
def superuser(user_factory):
    def make_user(**kwargs):
        return user_factory(is_staff=True, is_superuser=True, **kwargs)

    return make_user


@pytest.fixture
def authorized_superuser(api_client, superuser):
    user = superuser()
    api_client.force_login(user)
    return user


@pytest.fixture
def test_plan_from_api(api_client, authorized_superuser, test_plan):
    response = api_client.send_request('api:v1:testplan-detail', reverse_kwargs={'pk': test_plan.id})
    return json.loads(response.content)


@pytest.fixture
def combined_parameters(number_of_param_groups, number_of_entities_in_group, parameter_factory):
    parameters = []
    for _ in range(number_of_param_groups):
        src_param = parameter_factory()
        parameters.append(src_param.id)
        for _ in range(number_of_entities_in_group - 1):
            parameters.append(parameter_factory(group_name=src_param.group_name).id)
    number_of_combinations = pow(number_of_entities_in_group, number_of_param_groups)
    return parameters, number_of_combinations


@pytest.fixture
def several_test_plans_from_api(api_client, authorized_superuser, parameter_factory, project):
    parameters = []
    for _ in range(3):
        parameters.append(parameter_factory().id)

    test_plans = []
    for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
        testplan_dict = {
            'name': f'Test plan {idx}',
            'due_date': constants.DATE,
            'started_at': constants.DATE,
            'parameters': parameters,
            'project': project.id
        }
        response = api_client.send_request('api:v1:testplan-list', testplan_dict, HTTPStatus.CREATED, RequestType.POST)
        test_plans.append(json.loads(response.content)[0])

    return test_plans, project.id


@pytest.fixture
def generate_objects(project, project_factory, test_plan_factory, test_result_factory, test_suite_factory,
                     test_case_factory, parameter_factory, test_factory):
    cases = []
    parameters = [parameter_factory(project=project) for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)]
    for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
        parameter_factory(project=project)
    for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
        project_factory()
    for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
        parent = test_suite_factory(project=project)
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            cases.append(test_case_factory(project=project, suite=parent))
            test_suite_factory(project=project, parent=parent)
    for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
        parent = test_plan_factory(project=project)
        parent.parameters.set(parameters)
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            test_plan_factory(project=project, parent=parent)
    for case in cases:
        test = test_factory(case=case, project=project)
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            test_result_factory(test=test, project=project)
    yield


@pytest.fixture
def create_file(extension, media_directory):
    with open('tests/media_for_tests/test.png', 'rb') as file:
        png_bin = file.read()
    with open('tests/media_for_tests/test.jpeg', 'rb') as file:
        jpeg_bin = file.read()
    extension_to_content_type = {
        '.txt': ('text/plain', b'Test content'),
        '.png': ('image/png', png_bin),
        '.jpeg': ('image/jpeg', jpeg_bin),
        '.pdf': ('application/pdf', b'Test content'),
        '.zip': ('application/zip', b'Test content'),
    }
    name = f'test_file{extension}'
    file = SimpleUploadedFile(
        name,
        extension_to_content_type[extension][1],
        content_type=extension_to_content_type[extension][0]
    )
    yield file


@pytest.fixture
def media_directory(settings):
    tmp_dir = 'tmp_test_media/'
    settings.MEDIA_ROOT = tmp_dir
    yield tmp_dir
    if os.path.exists(tmp_dir):
        shutil.rmtree(tmp_dir)


@pytest.fixture
def data_for_cascade_tests_behaviour(project, test_plan_factory, test_suite_factory,
                                     test_case_factory, test_factory, test_result_factory):
    parent_plan = test_plan_factory(project=project)
    test_suite = test_suite_factory(project=project)
    test_case1 = test_case_factory(project=project, suite=test_suite)
    test_case2 = test_case_factory(project=project, suite=test_suite)
    expected_objects = {
        'project': [project],
        'testplan': [parent_plan],
        'suite': [test_suite],
        'case': [test_case1, test_case2],
        'test': [],
        'result': []
    }
    child_test_plans = []
    for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
        test_plan = test_plan_factory(project=project, parent=parent_plan)
        child_test_plans.append(test_plan)
        expected_objects['testplan'].append(test_plan)

    for case in [test_case1, test_case2]:
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            test = test_factory(case=case, plan=child_test_plans[0], project=project)
            expected_objects['test'].append(test)
            for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
                expected_objects['result'].append(test_result_factory(test=test, project=project))
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            test = test_factory(case=case, plan=child_test_plans[-1], project=project)
            expected_objects['test'].append(test)
            for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
                expected_objects['result'].append(test_result_factory(test=test, project=project))
    objects_count = {}
    for key, value in expected_objects.items():
        objects_count[key] = len(value)
    yield expected_objects, objects_count


@pytest.fixture
def generate_historical_objects(test_plan_factory, test_factory, test_result_factory, user_factory):
    parent_plan = test_plan_factory()
    inner_plan = test_plan_factory(parent=parent_plan)
    plan = test_plan_factory(parent=inner_plan)
    test = test_factory(plan=plan)
    test2 = test_factory(plan=plan)
    users_list = []
    result_list = []
    for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
        if idx % 2 == 0:
            user = user_factory(username=f'v.testovich{idx}')
            users_list.append(user)
            result_list.append(test_result_factory(user=user, status=0, test=test))
        else:
            user = user_factory(username=f'y.testovich{idx}')
            users_list.append(user)
            result = test_result_factory(user=user, status=1, test=test2)
            with mock.patch('django.utils.timezone.now', return_value=result.created_at + timezone.timedelta(days=3)):
                result.save()
    for historical_result in TestResult.history.all():
        historical_result.history_user = historical_result.history_object.user
        historical_result.save()
    return parent_plan


@pytest.fixture
def multiple_plans_data_project_statistics(project, test_plan_factory, test_result_factory, test_factory):
    root_plans = []
    with mock.patch(
            'django.utils.timezone.now',
            return_value=timezone.make_aware(timezone.datetime(2000, 1, 2), timezone.utc)
    ):
        for _ in range(5):
            plan = test_plan_factory(project=project)
            test_result_factory(test=test_factory(plan=plan), project=project)
            root_plans.append(plan)
    plans_depth_1 = []
    with mock.patch(
            'django.utils.timezone.now',
            return_value=timezone.make_aware(timezone.datetime(2000, 1, 4), timezone.utc)
    ):
        for parent_plan in root_plans:
            plan = test_plan_factory(project=project, parent=parent_plan)
            test_result_factory(test=test_factory(plan=plan), project=project)
            plans_depth_1.append(plan)
    plans_depth_2 = []
    with mock.patch(
            'django.utils.timezone.now',
            return_value=timezone.make_aware(timezone.datetime(2000, 1, 4), timezone.utc)
    ):
        for parent_plan in plans_depth_1:
            plan = test_plan_factory(project=project, parent=parent_plan)
            test_result_factory(test=test_factory(plan=plan), project=project)
            plans_depth_2.append(plan)
    start_date = timezone.datetime(2000, 1, 1).isoformat()
    end_date = timezone.datetime(2000, 1, 3).isoformat(),
    expected = [
        {
            'id': plan.id,
            'tests_total': 3,
            'tests_progress_period': 1,
            'tests_progress_total': 3
        } for plan in root_plans
    ]
    return expected, start_date, end_date


@pytest.fixture
def result_filter_data_project_statistics(project, test_plan_factory, test_result_factory, test_factory):
    root_plan = test_plan_factory(project=project)
    child_plan = test_plan_factory(project=project, parent=root_plan)
    with mock.patch(
            'django.utils.timezone.now',
            return_value=timezone.make_aware(timezone.datetime(2000, 1, 2), timezone.utc)
    ):
        for _ in range(3):
            test_result_factory(test=test_factory(plan=child_plan), project=project)
    with mock.patch(
            'django.utils.timezone.now',
            return_value=timezone.make_aware(timezone.datetime(2000, 1, 4), timezone.utc)
    ):
        test_result_factory(test=test_factory(plan=child_plan), project=project)

    start_date = timezone.datetime(2000, 1, 1).isoformat()
    end_date = timezone.datetime(2000, 1, 3).isoformat(),
    expected = [
        {
            'id': plan.id,
            'tests_total': 3,
            'tests_progress_period': 1,
            'tests_progress_total': 3
        } for plan in [root_plan, child_plan]
    ]
    return expected, start_date, end_date


@pytest.fixture
def data_different_statuses_project_statistics(project, test_plan_factory, test_result_factory, test_factory):
    root_plan = test_plan_factory(project=project)
    child_plan = test_plan_factory(project=project, parent=root_plan)
    for day, status in zip(range(2, 12, 2), TestStatuses.values):
        with mock.patch(
                'django.utils.timezone.now',
                return_value=timezone.make_aware(timezone.datetime(2000, 1, day), timezone.utc)
        ):
            test_result_factory(test=test_factory(plan=child_plan), project=project, status=status)

    start_date = timezone.datetime(2000, 1, 11).isoformat()
    end_date = timezone.datetime(2000, 1, 13).isoformat(),
    expected = [
        {
            'tests_total': 7,
            'id': plan.id,
            'tests_progress_period': 0,
            'tests_progress_total': 6,
        } for plan in [root_plan, child_plan]
    ]
    return expected, start_date, end_date


@pytest.fixture
def empty_plan_data_project_statistics(project, test_plan_factory, test_result_factory, test_factory):
    root_plan = test_plan_factory(project=project)
    root_plan_2 = test_plan_factory(project=project, parent=root_plan)
    with mock.patch(
            'django.utils.timezone.now',
            return_value=timezone.make_aware(timezone.datetime(2000, 1, 2), timezone.utc)
    ):
        test_result_factory(test=test_factory(plan=root_plan_2), project=project)

    start_date = timezone.datetime(2000, 1, 1).isoformat()
    end_date = timezone.datetime(2000, 1, 3).isoformat()
    expected = [
        {
            'tests_total': 0,
            'id': root_plan.id,
            'tests_progress_period': 0,
            'tests_progress_total': 0,
        },
        {
            'tests_count': 1,
            'id': root_plan_2.id,
            'tests_progress_period': 1,
            'tests_progress_total': 1,
        }
    ]
    return expected, start_date, end_date


@pytest.fixture
def use_dummy_cache_backend(settings):
    settings.CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.dummy.DummyCache",
        }
    }

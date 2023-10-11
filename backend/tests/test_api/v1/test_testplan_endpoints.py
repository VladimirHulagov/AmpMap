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
import itertools
import json
from copy import deepcopy
from datetime import datetime, timedelta
from http import HTTPStatus
from operator import itemgetter
from unittest import mock

import pytest
from tests_description.models import TestCase
from tests_representation.api.v1.serializers import TestPlanOutputSerializer, TestPlanTreeSerializer
from tests_representation.choices import TestStatuses
from tests_representation.models import Test, TestPlan, TestResult

from tests import constants
from tests.commons import RequestType, model_to_dict_via_serializer
from tests.error_messages import PERMISSION_ERR_MSG


@pytest.mark.django_db(reset_sequences=True)
class TestPlanEndpoints:
    view_name_detail = 'api:v1:testplan-detail'
    view_name_list = 'api:v1:testplan-list'
    view_name_statistics = 'api:v1:testplan-statistics'
    view_name_activity = 'api:v1:testplan-activity'
    view_name_case_ids = 'api:v1:cases-by-plan'
    view_name_histogram = 'api:v1:testplan-histogram'

    def test_list(self, api_client, authorized_superuser, several_test_plans_from_api):
        expected_instances, project_id = several_test_plans_from_api
        response = api_client.send_request(self.view_name_list, query_params={'project': project_id})

        for instance_dict in json.loads(response.content)['results']:
            assert instance_dict in expected_instances, f'{instance_dict} was not found in expected instances.'

    def test_retrieve(self, api_client, authorized_superuser, test_plan_from_api):
        response = api_client.send_request(self.view_name_detail, reverse_kwargs={'pk': test_plan_from_api.get('id')})
        actual_dict = json.loads(response.content)
        assert actual_dict == test_plan_from_api, 'Actual model dict is different from expected'

    @pytest.mark.parametrize('number_of_param_groups, number_of_entities_in_group', [(1, 3), (2, 2), (3, 4)])
    def test_creation(self, api_client, authorized_superuser, combined_parameters, project):
        parameters, expected_number_of_plans = combined_parameters
        testplan_dict = {
            'name': 'Test plan',
            'due_date': constants.DATE,
            'started_at': constants.DATE,
            'parameters': parameters,
            'project': project.id
        }
        response = api_client.send_request(self.view_name_list, testplan_dict, HTTPStatus.CREATED, RequestType.POST)
        endpoint_plans = json.loads(response.content)
        actual_parameters_combinations = []
        for plan in endpoint_plans:
            params_from_plan = plan.get('parameters').sort
            assert params_from_plan not in actual_parameters_combinations, 'Found duplicate params in TestPlans'
            actual_parameters_combinations.append(plan.get('parameters'))
        assert TestPlan.objects.count() == expected_number_of_plans, f'Expected number of test plans ' \
                                                                     f'"{expected_number_of_plans}"' \
                                                                     f'actual: "{TestPlan.objects.count()}"'
        assert len(endpoint_plans) == expected_number_of_plans, f'Expected number of test plans from endpoint ' \
                                                                f'"{expected_number_of_plans}"' \
                                                                f'actual: "{len(endpoint_plans)}"'

    @pytest.mark.parametrize('number_of_param_groups, number_of_entities_in_group', [(1, 3), (2, 2), (3, 4)])
    def test_tests_generated_on_create(self, api_client, authorized_superuser, combined_parameters, test_case_factory,
                                       project):
        number_of_cases = 5
        case_ids = [test_case_factory().id for _ in range(number_of_cases)]
        parameters, expected_number_of_plans = combined_parameters
        number_of_tests = number_of_cases * expected_number_of_plans
        testplan_dict = {
            'name': 'Test plan',
            'due_date': constants.DATE,
            'started_at': constants.DATE,
            'parameters': parameters,
            'test_cases': case_ids,
            'project': project.id
        }
        response = api_client.send_request(self.view_name_list, testplan_dict, HTTPStatus.CREATED, RequestType.POST)
        test_plans = json.loads(response.content)
        pk = test_plans[0].get('id')
        assert Test.objects.count() == number_of_tests
        assert TestCase.objects.count() == number_of_cases
        update_dict = {
            'test_cases': case_ids[:-1],
        }
        api_client.send_request(
            self.view_name_detail,
            update_dict,
            HTTPStatus.OK,
            RequestType.PATCH,
            reverse_kwargs={'pk': pk}
        )
        assert Test.objects.count() == number_of_tests - 1, 'More then one test was deleted by updating'

    @pytest.mark.parametrize(
        'slice_num, expected_number, err_msg',
        [
            (None, 5, 'Number of cases should not change'),
            (1, 1, 'Number of cases was not decreased'),
            (0, 0, 'Cases were found after updating with empty list')
        ],
        ids=['Update with same cases', 'Update to one case', 'Update to 0 cases']
    )
    def test_tests_generated_deleted_on_partial_update(self, api_client, authorized_superuser, test_plan_from_api,
                                                       test_case_factory, slice_num, expected_number, err_msg):
        number_of_cases = 5
        case_ids = [test_case_factory().id for _ in range(number_of_cases)]
        assert not Test.objects.count()
        assert TestCase.objects.count() == number_of_cases
        api_client.send_request(
            self.view_name_detail,
            data={'test_cases': case_ids},
            expected_status=HTTPStatus.OK,
            request_type=RequestType.PATCH,
            reverse_kwargs={'pk': test_plan_from_api.get('id')}
        )
        api_client.send_request(
            self.view_name_detail,
            data={'test_cases': case_ids[:slice_num]},
            expected_status=HTTPStatus.OK,
            request_type=RequestType.PATCH,
            reverse_kwargs={'pk': test_plan_from_api.get('id')}
        )
        assert Test.objects.count() == expected_number, err_msg

    def test_delete(self, api_client, authorized_superuser, test_plan):
        assert TestPlan.objects.count() == 1, 'Test case was not created'
        api_client.send_request(
            self.view_name_detail,
            expected_status=HTTPStatus.NO_CONTENT,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': test_plan.pk}
        )
        assert not TestPlan.objects.count(), f'Test plan with id "{test_plan.id}" was not deleted.'

    def test_archived_editable_for_admin_only(self, api_client, authorized_superuser, test_plan_factory, user):
        api_client.force_login(user)
        plan = test_plan_factory(is_archive=True)
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': plan.pk},
            request_type=RequestType.PATCH,
            expected_status=HTTPStatus.FORBIDDEN,
            data={}
        )
        assert json.loads(response.content)['detail'] == PERMISSION_ERR_MSG

    @pytest.mark.django_db(reset_sequences=True)
    def test_parameter_filter(self, api_client, authorized_superuser, test_plan_with_parameters_factory,
                              parameter_factory, project):
        common_group = [parameter_factory(project=project) for _ in range(3)]
        group_1 = deepcopy(common_group)
        group_1.append(parameter_factory())
        group_2 = deepcopy(common_group)
        group_2.append(parameter_factory())
        parameter_groups = [common_group, group_1, group_2]
        number_of_objects_per_group = [3, 2, 4]
        expected_list = []
        for group, number_of_objects in zip(parameter_groups, number_of_objects_per_group):
            expected_group = []
            for _ in range(number_of_objects):
                expected_group.append(
                    model_to_dict_via_serializer(
                        test_plan_with_parameters_factory(parameters=group, project=project), TestPlanOutputSerializer
                    )
                )
            expected_list.append(expected_group)
        response = api_client.send_request(
            self.view_name_list,
            query_params={
                'project': project.id,
                'parameters': ','.join([str(elem.id) for elem in common_group])
            }
        )
        expected_all_objects = list(itertools.chain.from_iterable(expected_list)).sort(key=lambda elem: elem['id'])
        assert expected_all_objects == json.loads(response.content)['results'].sort(key=lambda elem: elem['id']), \
            'Not all elements containing required parameters were found'
        for idx, group in enumerate(parameter_groups[1:], start=1):
            response = api_client.send_request(
                self.view_name_list,
                query_params={
                    'project': project.id,
                    'parameters': ','.join([str(elem.id) for elem in group])
                }
            )
            assert expected_list[idx] == json.loads(response.content)['results'], 'Test plans were filtered by ' \
                                                                                  'parameters incorrectly'
        response = api_client.send_request(
            self.view_name_list,
            query_params={
                'project': project.id,
                'parameters': '20000'
            }
        )
        assert len(json.loads(response.content)['results']) == 0, 'Test plan displayed with non-existent parameter.'
        response = api_client.send_request(
            self.view_name_list,
            query_params={
                'project': project.id,
                'parameters': ','.join([str(elem.id) for elem in group_2]) + ',2000'
            }
        )
        assert not json.loads(response.content)['results'], 'If incorrect id is in filter no plans will be returned.'

    def test_statistics(self, api_client, authorized_superuser, test_plan, test_factory, test_result_factory):
        number_of_statuses = {
            0: 6,
            1: 12,
            2: 3,
            3: 10,
            4: 0,
            5: 1,
            6: 15
        }
        for status_key, _ in TestStatuses.choices:
            for idx in range(number_of_statuses[status_key]):
                if idx % 2 == 0:
                    test_result_factory(test=test_factory(plan=test_plan), status=status_key)
                else:
                    test_result_factory(test=test_factory(plan=test_plan), status=status_key, is_archive=True)
        content = json.loads(
            api_client.send_request(self.view_name_statistics, reverse_kwargs={'pk': test_plan.id}).content
        )
        label_to_stat = {}
        for elem in content:
            label_to_stat[elem['label'].lower()] = elem['value']
        for status_key, status_label, in TestStatuses.choices:
            assert number_of_statuses[status_key] == label_to_stat[status_label.lower()], f'Statistics for ' \
                                                                                          f'{status_label} is wrong'

    def test_statistsics_after_plan_cases_updated(self, api_client, authorized_superuser, test_plan, test_case_factory):
        number_of_cases = 5
        new_number_of_cases = 3
        untested_label = TestStatuses.UNTESTED.label.lower()
        case_ids = [test_case_factory().id for _ in range(number_of_cases)]
        assert TestCase.objects.count() == number_of_cases
        api_client.send_request(
            self.view_name_detail,
            data={'test_cases': case_ids},
            expected_status=HTTPStatus.OK,
            request_type=RequestType.PATCH,
            reverse_kwargs={'pk': test_plan.id}
        )
        content = json.loads(
            api_client.send_request(self.view_name_statistics, reverse_kwargs={'pk': test_plan.id}).content
        )
        label_to_stat = {}
        for elem in content:
            label_to_stat[elem['label'].lower()] = elem['value']

        assert label_to_stat[untested_label] == number_of_cases, 'Incorrect statistics before update'

        api_client.send_request(
            self.view_name_detail,
            data={'test_cases': case_ids[:new_number_of_cases]},
            expected_status=HTTPStatus.OK,
            request_type=RequestType.PATCH,
            reverse_kwargs={'pk': test_plan.id}
        )
        content = json.loads(
            api_client.send_request(self.view_name_statistics, reverse_kwargs={'pk': test_plan.id}).content
        )
        label_to_stat = {}
        for elem in content:
            label_to_stat[elem['label'].lower()] = elem['value']

        assert label_to_stat[untested_label] == new_number_of_cases, 'Incorrect statistics after update'

    @pytest.mark.parametrize(
        'attribute, attr_values',
        [
            (None, None),
            ('run_id', ['first_value', 'second_value'])
        ],
        ids=['Histogram by date', 'Histogram by attribute']
    )
    def test_histogram(
            self, api_client, authorized_superuser, test_plan,
            test_factory, test_result_factory,
            attribute, attr_values
    ):
        number_of_statuses = {
            0: 6,
            1: 12,
            2: 3,
            3: 10,
            4: 0,
            6: 15
        }
        end_date = datetime.now()
        start_date = end_date - timedelta(days=1)
        if not attribute:
            expected_results = [
                {'point': start_date.strftime('%Y-%m-%d')},
                {'point': end_date.strftime('%Y-%m-%d')}
            ]
        else:
            expected_results = [{'point': attr_value} for attr_value in attr_values]

        for status_key, status_value in [
            (obj.value, obj.label) for obj in TestStatuses if obj != TestStatuses.UNTESTED
        ]:
            for idx in range(number_of_statuses[status_key]):
                attributes = {attribute: attr_values[idx % 2]} if attribute else {}
                if idx % 2 == 0:
                    test_result_factory(
                        test=test_factory(plan=test_plan),
                        status=status_key,
                        created_at=start_date,
                        attributes=attributes
                    )
                else:
                    test_result_factory(
                        test=test_factory(plan=test_plan),
                        status=status_key,
                        created_at=end_date,
                        attributes=attributes
                    )

                if expected_results[idx % 2].get(status_value.lower()):
                    expected_results[idx % 2][status_value.lower()] += 1
                else:
                    expected_results[idx % 2][status_value.lower()] = 1

        content = json.loads(
            api_client.send_request(
                self.view_name_histogram,
                reverse_kwargs={'pk': test_plan.id},
                query_params={
                    'start_date': start_date.date(),
                    'end_date': end_date.date(),
                    'attribute': attribute if attribute else ''
                },
                expected_status=HTTPStatus.OK
            ).content
        )
        assert len(expected_results) == len(content), 'Expected result did not match result'
        for idx in range(len(expected_results)):
            for key, value in expected_results[idx].items():
                point = expected_results[idx]['point']
                value_from_response = content[idx][key]
                assert value == value_from_response, (f'Expect in point = {point}, '
                                                      f'{key} = {value}, get value = {value_from_response}')

    def test_child_parent_logic(self, api_client, authorized_superuser, test_plan_factory):
        parent = test_plan_factory()
        child = test_plan_factory(parent=parent)
        api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': parent.id},
            data={'parent': child.id},
            request_type=RequestType.PATCH,
            expected_status=HTTPStatus.BAD_REQUEST
        )

    def test_search(self, api_client, authorized_superuser, test_plan_with_parameters_factory, parameter_factory,
                    project):
        parameters = [parameter_factory(project=project) for _ in range(2)]
        root_plan = test_plan_with_parameters_factory(project=project)
        inner_plan = test_plan_with_parameters_factory(parent=root_plan, project=project)
        test_plan_with_parameters_factory(parent=root_plan, project=project)
        expected_plans = []
        expected_plans2 = []
        search_name = 'search_name'
        for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            if idx % 2:
                expected_plans.append(
                    test_plan_with_parameters_factory(parent=inner_plan, name=search_name,
                                                      project=project)
                )
            else:
                expected_plans2.append(
                    test_plan_with_parameters_factory(parent=inner_plan, parameters=parameters, project=project)
                )
        expected_output = model_to_dict_via_serializer(root_plan, TestPlanTreeSerializer)
        inner_dict = model_to_dict_via_serializer(inner_plan, TestPlanTreeSerializer)
        inner_dict['children'] = model_to_dict_via_serializer(expected_plans, TestPlanTreeSerializer, many=True)
        expected_output['children'] = [inner_dict]
        actual_data = json.loads(
            api_client.send_request(
                self.view_name_list,
                query_params={'project': project.id, 'search': search_name, 'treeview': 1, 'ordering': 'created_at'}
            ).content
        )['results']
        actual_data[0]['children'][0]['children'].sort(key=itemgetter('id'))
        expected_output['children'][0]['child_test_plans'] = actual_data[0]['children'][0]['child_test_plans']
        expected_output['child_test_plans'] = actual_data[0]['child_test_plans']
        assert actual_data == [expected_output], 'Only objects with searched named and their ' \
                                                 'ancestors should be in treeview'
        actual_data = json.loads(
            api_client.send_request(
                self.view_name_list,
                query_params={'project': project.id, 'treeview': 1}
            ).content
        )['results']
        assert [expected_output] != actual_data, 'List view and search are same.'
        actual_data = json.loads(
            api_client.send_request(
                self.view_name_list,
                query_params={
                    'project': project.id,
                    'search': ' '.join([parameter.data for parameter in parameters]),
                    'treeview': 1
                }
            ).content
        )['results']
        inner_dict['children'] = model_to_dict_via_serializer(expected_plans2, TestPlanTreeSerializer, many=True)
        expected_output['children'] = [inner_dict]
        expected_output['children'][0]['child_test_plans'] = actual_data[0]['children'][0]['child_test_plans']
        expected_output['child_test_plans'] = actual_data[0]['child_test_plans']
        actual_data[0]['children'][0]['children'].sort(key=itemgetter('id'))
        assert actual_data == [expected_output], 'Parameters search got more elements than expected.'
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

    def test_activity(self, api_client, authorized_superuser, test_plan_factory, test_factory, test_result_factory,
                      user_factory):
        parent_plan = test_plan_factory()
        inner_plan = test_plan_factory(parent=parent_plan)
        plan = test_plan_factory(parent=inner_plan)
        test = test_factory(plan=plan)
        users_list = []
        result_list = []
        for idx in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            if idx % 2 == 0:
                user = user_factory(first_name='Vasily', last_name=f'Testovich{idx}')
                users_list.append(user)
                result_list.append(test_result_factory(user=user, status=0, test=test))
            else:
                user = user_factory(first_name='Yana', last_name=f'Albertovna{idx}')
                users_list.append(user)
                result = test_result_factory(user=user, status=1, test=test)
                with mock.patch('django.utils.timezone.now', return_value=result.created_at + timedelta(days=3)):
                    result.save()
        response = json.loads(
            api_client.send_request(self.view_name_activity, reverse_kwargs={'pk': parent_plan.id}).content
        )
        assert len(response['results']) == 2, 'We expect history events in two different dates.'
        for date in response['results'].values():
            for action in date:
                assert action['breadcrumbs']['title'] == plan.name
                assert action['breadcrumbs']['parent']['title'] == inner_plan.name
                assert action['breadcrumbs']['parent']['parent']['title'] == parent_plan.name

    @pytest.mark.parametrize(
        'filter_name, filter_values',
        [
            ('history_user', [('4', 1), ('4,6,8,10', 4), ('3524', 0)]),
            ('test', [('1', 5), ('2', 10), ('3524', 0)]),
            ('status', [('0', 5), ('1', 10), ('0,1', 15), ('3524', 0)]),
            ('history_type', [('~', 5), ('%2B', 10), ('~,%2B', 15), ('ASD', 0)]),
        ]
    )
    def test_activity_filters(self, api_client, authorized_superuser, filter_name, filter_values,
                              generate_historical_objects):
        parent_plan = generate_historical_objects
        for filter_value in filter_values:
            args, number_of_objects = filter_value
            response = json.loads(
                api_client.send_request(
                    self.view_name_activity, reverse_kwargs={'pk': parent_plan.id},
                    query_params={filter_name: args}
                ).content
            )
            assert number_of_objects == response['count']

    @pytest.mark.parametrize('ordering', ['history_user', 'test__case__name', 'history_date', 'history_type'])
    def test_activity_ordering(self, api_client, authorized_superuser, generate_historical_objects, ordering):
        parent_plan = generate_historical_objects
        for sign in ['', '-']:
            results = TestResult.history.filter().order_by('history_date', f'{sign}{ordering}')
            results = [res for res in results]
            content = json.loads(
                api_client.send_request(
                    self.view_name_activity, reverse_kwargs={'pk': parent_plan.id},
                    query_params={'ordering': f'history_date, {sign}{ordering}'}
                ).content
            )
            response_results = []
            for elem in content['results'].values():
                response_results.extend(elem)
            for result, response_result in zip(results, response_results):
                assert result.id == response_result['id'], 'Wrong order returned.'

    @pytest.mark.parametrize(
        'search_data, number_of_objects',
        [
            ('v.testovich', 5),
            ('v.testovich0', 1),
            ('testovich', 15),
            ('TestCaseName', 15),
            ('non-existent', 0)
        ]
    )
    def test_search_filter(self, api_client, authorized_superuser, generate_historical_objects, search_data,
                           number_of_objects):
        parent_plan = generate_historical_objects
        response = json.loads(
            api_client.send_request(
                self.view_name_activity,
                reverse_kwargs={'pk': parent_plan.id},
                query_params={'search': search_data}
            ).content
        )

        assert response['count'] == number_of_objects, 'Number of found objects did not match.'

    def test_cases_by_plan_id(self, api_client, authorized_superuser, test_factory, test_plan_factory):
        root_plan = test_plan_factory()
        inner_plan_lvl_1 = test_plan_factory(parent=root_plan)
        inner_plan_2_lvl_1 = test_plan_factory(parent=root_plan)
        inner_plan_lvl_2 = test_plan_factory(parent=inner_plan_lvl_1)
        plans = [
            root_plan,
            inner_plan_lvl_1,
            inner_plan_2_lvl_1,
            inner_plan_lvl_2,
        ]
        expected_qs = [
            Test.objects.all(),
            Test.objects.filter(plan=inner_plan_lvl_1) | Test.objects.filter(plan=inner_plan_lvl_2),
            Test.objects.filter(plan=inner_plan_2_lvl_1),
            Test.objects.filter(plan=inner_plan_lvl_2)
        ]
        for plan in plans:
            test_factory(plan=plan)
        for plan, expected_qs in zip(plans, expected_qs):
            case_ids = json.loads(
                api_client.send_request(
                    self.view_name_case_ids,
                    reverse_kwargs={'pk': plan.id}
                ).content
            )['case_ids']
            assert case_ids == [test.case.id for test in expected_qs.order_by('case__id')]
            case_ids = json.loads(
                api_client.send_request(
                    self.view_name_case_ids,
                    reverse_kwargs={'pk': plan.id},
                    query_params={'include_children': False}
                ).content
            )['case_ids']
            assert case_ids == [test.case.id for test in Test.objects.filter(plan=plan).order_by('case__id')]

# TestY TMS - Test Management System
# Copyright (C) 2022 KNS Group LLC (YADRO)
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
from copy import deepcopy
from http import HTTPStatus
from operator import attrgetter
from typing import Any, Iterable
from unittest import mock

import allure
import pytest
from django.db.models import Q, QuerySet
from django.forms import model_to_dict
from django.utils import timezone
from validators import TestPlanCasesValidator

from tests import constants
from tests.commons import RequestType, model_to_dict_via_serializer
from tests.error_messages import DATE_RANGE_ERROR, PERMISSION_ERR_MSG
from testy.core.models import Label
from testy.tests_description.models import TestCase
from testy.tests_representation.api.v1.serializers import TestPlanOutputSerializer, TestPlanTreeSerializer
from testy.tests_representation.choices import TestStatuses
from testy.tests_representation.models import Test, TestPlan, TestResult
from testy.tests_representation.selectors.testplan import TestPlanSelector as TPSelector
from testy.utilities.tree import form_tree_prefetch_objects


@pytest.mark.django_db(reset_sequences=True)
@allure.parent_suite('Test plans')
@allure.suite('Integration tests')
@allure.sub_suite('Endpoints')
class TestPlanEndpoints:
    view_name_detail = 'api:v1:testplan-detail'
    view_name_list = 'api:v1:testplan-list'
    view_name_statistics = 'api:v1:testplan-statistics'
    view_name_activity = 'api:v1:testplan-activity'
    view_name_case_ids = 'api:v1:testplan-cases'
    view_name_histogram = 'api:v1:testplan-histogram'
    view_name_copy = 'api:v1:testplan-copy'

    @allure.title('Test list display')
    def test_list(self, superuser_client, several_test_plans_from_api, project):
        with allure.step('Generate data for tests'):
            expected_response = model_to_dict_via_serializer(
                TestPlan.objects.filter(pk__in=several_test_plans_from_api),
                many=True,
                serializer_class=TestPlanOutputSerializer,
            )
        response = superuser_client.send_request(self.view_name_list, query_params={'project': project.id})
        with allure.step('Validate response is matching expected data'):
            assert response.json_strip() == expected_response

    @allure.title('Test detail display')
    def test_retrieve(self, superuser_client, test_plan_from_api):
        response = superuser_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': test_plan_from_api.get('id')},
        )
        actual_dict = response.json()
        with allure.step('Validate response is matching expected data'):
            assert actual_dict == test_plan_from_api, 'Actual model dict is different from expected'

    @pytest.mark.parametrize('number_of_param_groups, number_of_entities_in_group', [(1, 3), (2, 2), (3, 4)])
    def test_creation(
        self,
        superuser_client,
        combined_parameters,
        project,
        number_of_param_groups,
        number_of_entities_in_group,
    ):
        parameters, expected_number_of_plans = combined_parameters
        allure_title = 'Test plan creation with number of label groups: {0}, with number of labels: {1}'
        allure.dynamic.title(allure_title.format(number_of_param_groups, number_of_entities_in_group))
        testplan_dict = {
            'name': 'Test plan',
            'due_date': constants.END_DATE,
            'started_at': constants.DATE,
            'parameters': parameters,
            'project': project.id,
        }
        response = superuser_client.send_request(
            self.view_name_list,
            testplan_dict,
            HTTPStatus.CREATED,
            RequestType.POST,
        )
        response_body = response.json()
        actual_parameters_combinations = []
        with allure.step('Validate parameters on test plan'):
            for plan in response_body:
                params_from_plan = plan.get('parameters').sort()
                assert params_from_plan not in actual_parameters_combinations, 'Found duplicate params in TestPlans'
                actual_parameters_combinations.append(plan.get('parameters'))
        with allure.step('Validate number of plans'):
            assert TestPlan.objects.count() == expected_number_of_plans, f'Expected number of test plans ' \
                                                                         f'"{expected_number_of_plans}"' \
                                                                         f'actual: "{TestPlan.objects.count()}"'

    @allure.title('Test due date validation')
    def test_due_date_restrictions(self, project, superuser_client):
        with allure.step('Set due date >= started_at'):
            testplan_dict = {
                'name': 'Test plan',
                'due_date': constants.DATE,
                'started_at': constants.DATE,
                'project': project.id,
            }
        response = superuser_client.send_request(
            self.view_name_list,
            testplan_dict,
            HTTPStatus.BAD_REQUEST,
            RequestType.POST,
        )
        endpoint_plans = response.json()
        with allure.step('Validate error message from response'):
            assert endpoint_plans['errors'][0] == DATE_RANGE_ERROR

    @pytest.mark.parametrize('number_of_param_groups, number_of_entities_in_group', [(1, 3), (2, 2), (3, 4)])
    @allure.title('Test tests generated on test plan creation')
    def test_tests_generated_on_create(self, superuser_client, combined_parameters, test_case_factory, project):
        number_of_cases = 5
        case_ids = [test_case_factory(project=project).id for _ in range(number_of_cases)]
        parameters, expected_number_of_plans = combined_parameters
        number_of_tests = number_of_cases * expected_number_of_plans
        testplan_dict = {
            'name': 'Test plan',
            'due_date': constants.END_DATE,
            'started_at': constants.DATE,
            'parameters': parameters,
            'test_cases': case_ids,
            'project': project.id,
        }
        response = superuser_client.send_request(
            self.view_name_list,
            testplan_dict,
            HTTPStatus.CREATED,
            RequestType.POST,
        )
        test_plans = response.json()
        pk = test_plans[0].get('id')
        with allure.step('Validate number of created tests'):
            assert Test.objects.count() == number_of_tests
        with allure.step('Validate number of cases'):
            assert TestCase.objects.count() == number_of_cases

        update_dict = {
            'test_cases': case_ids[:-1],
        }
        superuser_client.send_request(
            self.view_name_detail,
            update_dict,
            HTTPStatus.OK,
            RequestType.PATCH,
            reverse_kwargs={'pk': pk},
        )
        with allure.step('Validate number of tests after update'):
            assert Test.objects.count() == number_of_tests - 1, 'More then one test was deleted by updating'

    @pytest.mark.parametrize(
        'slice_num, expected_number, validation_msg',
        [
            (None, 5, 'Validate number of tests did not change'),
            (1, 1, 'Validate number of tests decreased'),
            (0, 0, 'Validate no tests found'),
        ],
        ids=['Update with same cases', 'Update to one case', 'Update to 0 cases'],
    )
    @allure.title('Test number of tests updated on test plan update')
    def test_tests_generated_deleted_on_partial_update(
        self,
        superuser_client,
        test_plan_from_api,
        test_case_factory,
        slice_num,
        expected_number,
        validation_msg,
    ):
        number_of_cases = 5
        case_ids = [test_case_factory().id for _ in range(number_of_cases)]
        assert not Test.objects.count()
        assert TestCase.objects.count() == number_of_cases
        with allure.step(f'Create test plan with {number_of_cases} test cases'):
            superuser_client.send_request(
                self.view_name_detail,
                data={'test_cases': case_ids},
                expected_status=HTTPStatus.OK,
                request_type=RequestType.PATCH,
                reverse_kwargs={'pk': test_plan_from_api.get('id')},
            )
        with allure.step(f'Update test plan with {number_of_cases} test cases'):
            superuser_client.send_request(
                self.view_name_detail,
                data={'test_cases': case_ids[:slice_num]},
                expected_status=HTTPStatus.OK,
                request_type=RequestType.PATCH,
                reverse_kwargs={'pk': test_plan_from_api.get('id')},
            )
        with allure.step(validation_msg):
            assert Test.objects.count() == expected_number

    @allure.title('Test test plan deletion')
    def test_delete(self, superuser_client, test_plan):
        assert TestPlan.objects.count() == 1, 'Test case was not created'
        superuser_client.send_request(
            self.view_name_detail,
            expected_status=HTTPStatus.NO_CONTENT,
            request_type=RequestType.DELETE,
            reverse_kwargs={'pk': test_plan.pk},
        )
        with allure.step('Validate test plan does not exist'):
            assert not TestPlan.objects.count()

    @allure.title('Test test plan is editable only for admin after being archived')
    def test_archived_editable_for_admin_only(self, api_client, test_plan_factory, user):
        api_client.force_login(user)
        plan = test_plan_factory(is_archive=True)
        response = api_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': plan.pk},
            request_type=RequestType.PATCH,
            expected_status=HTTPStatus.FORBIDDEN,
            data={},
        )
        with allure.step('Validate error message from response'):
            assert response.json()['detail'] == PERMISSION_ERR_MSG

    @pytest.mark.django_db(reset_sequences=True)
    def test_parameter_filter(
        self,
        superuser_client,
        test_plan_with_parameters_factory,
        parameter_factory,
        project,
    ):
        with allure.step('Create parameters that will be presented in every test plan'):
            common_group = [parameter_factory(project=project) for _ in range(3)]
            group_1 = deepcopy(common_group)
            group_2 = deepcopy(common_group)
        with allure.step('Add different parameters to group 1 and 2'):
            group_1.append(parameter_factory())
            group_2.append(parameter_factory())
        parameter_groups = [common_group, group_1, group_2]
        number_of_objects_per_group = [3, 2, 4]
        with allure.step('Generate testplans with different parameter groups'):
            expected_list = []
            for group, number_of_objects in zip(parameter_groups, number_of_objects_per_group):
                expected_group = []
                for _ in range(number_of_objects):
                    expected_group.append(
                        model_to_dict_via_serializer(
                            test_plan_with_parameters_factory(parameters=group, project=project),
                            TestPlanOutputSerializer,
                        ),
                    )
                expected_list.append(expected_group)
        with allure.step('Validate filter by common group returns all objects'):
            response = superuser_client.send_request(
                self.view_name_list,
                query_params={
                    'project': project.id,
                    'parameters': ','.join([str(elem.id) for elem in common_group]),
                },
            )
            expected_all_objects = list(itertools.chain.from_iterable(expected_list)).sort(key=lambda elem: elem['id'])
            assert expected_all_objects == response.json_strip().sort(key=lambda elem: elem['id']), \
                'Not all elements containing required parameters were found'

        for idx, group in enumerate(parameter_groups[1:], start=1):
            with allure.step(f'Validate filter by group {idx} returns only affected objects'):
                response = superuser_client.send_request(
                    self.view_name_list,
                    query_params={
                        'project': project.id,
                        'parameters': ','.join([str(elem.id) for elem in group]),
                    },
                )
                assert expected_list[idx] == response.json_strip(), 'Test plans were filtered by ' \
                                                                    'parameters incorrectly'
        with allure.step('Validate filter by non-existent group returns empty response'):
            response = superuser_client.send_request(
                self.view_name_list,
                query_params={
                    'project': project.id,
                    'parameters': '20000',
                },
            )
            assert not len(response.json_strip()), 'Test plan displayed with non-existent parameter.'
        with allure.step('Validate incorrect parameter'):
            response = superuser_client.send_request(
                self.view_name_list,
                query_params={
                    'project': project.id,
                    'parameters': ','.join([str(elem.id) for elem in group_2]) + ',2000',
                },
            )
            assert not response.json_strip(), 'If incorrect id is in filter no plans will be returned.'

    @allure.title('Test plans statistics view')
    def test_statistics(
        self,
        superuser_client,
        test_plan,
        test_factory,
        test_case_factory,
        test_result_factory,
    ):
        number_of_statuses = {
            0: 6,
            1: 12,
            2: 3,
            3: 10,
            4: 0,
            5: 1,
            6: 15,
        }
        estimates = {
            1: 60,
            2: 3600,
            5: 57780,
        }
        estimates_in_minutes = {
            1: 1.0,
            2: 60.0,
            5: 963.0,
        }
        for status_key, _ in TestStatuses.choices:
            for idx in range(number_of_statuses[status_key]):
                estimate = estimates.get(status_key, None)
                test_case = test_case_factory(estimate=estimate)
                if idx % 2 == 0:
                    test_result_factory(test=test_factory(plan=test_plan, case=test_case), status=status_key)
                else:
                    test_result_factory(
                        test=test_factory(plan=test_plan, case=test_case),
                        status=status_key,
                        is_archive=True,
                    )
        response_body = superuser_client.send_request(
            self.view_name_statistics,
            reverse_kwargs={'pk': test_plan.id},
        ).json()
        label_to_stat = {}
        estimates_to_stat = {}
        empty_estimates = {}
        for elem in response_body:
            for dict_obj, key in zip(
                [label_to_stat, estimates_to_stat, empty_estimates],
                ['value', 'estimates', 'empty_estimates'],
            ):
                dict_obj[elem['label'].lower()] = elem[key]
        for status_key, status_label, in TestStatuses.choices:
            with allure.step(f'Validate number of statuses for {status_key}'):
                assert number_of_statuses[status_key] == label_to_stat[status_label.lower()], f'Statistics for ' \
                                                                                              f'{status_label} is wrong'
                if status_key not in estimates:
                    assert empty_estimates[status_label.lower()] == label_to_stat[status_label.lower()], \
                        'Wrong empty estimates'
                    assert estimates_to_stat[status_label.lower()] == 0, f'Incorrect estimate for status {status_label}'
                else:
                    assert empty_estimates[status_label.lower()] == 0, 'Estimates is more than 0'
                    expected = estimates_in_minutes[status_key] * number_of_statuses[status_key]
                    assert estimates_to_stat[status_label.lower()] == expected, \
                        f'Estimate not equal for status {status_label}'

    @pytest.mark.parametrize(
        'estimate, period, expected_value',
        [
            (3600, 'minutes', '60.0'),
            (21_600, 'hours', '6.0'),
            (28_800, 'days', '1.0'),
        ],
        ids=[
            'estimate = 1h to minutes',
            'estimate = 6h to hours',
            'estimate = 8h to days',
        ],
    )
    def test_statistics_estimates_period(
        self,
        superuser_client,
        test_plan,
        test_factory,
        test_case_factory,
        test_result_factory,
        estimate,
        period,
        expected_value,
        request,
    ):
        allure.dynamic.title(f'Test plans statics by estimate periods {request.node.callspec.id}')
        test_case = test_case_factory(estimate=estimate)
        test_result_factory(test=test_factory(plan=test_plan, case=test_case))
        content = superuser_client.send_request(
            self.view_name_statistics,
            reverse_kwargs={'pk': test_plan.id},
            query_params={'estimate_period': period},
        ).json()
        actual_results = next(
            (obj for obj in content if obj['label'] == TestStatuses.UNTESTED.label.upper()),
        )
        with allure.step('Validate estimate value'):
            assert str(actual_results['estimates']) == expected_value, (
                f'Estimate did not match: expected {expected_value},'
                f' got: {actual_results["estimates"]}'
            )

    @allure.title('Test statistics changed after cases update on test plan')
    def test_statistics_after_plan_cases_updated(
        self,
        superuser_client,
        test_plan,
        test_case_factory,
    ):
        number_of_cases = 5
        new_number_of_cases = 3
        estimates = {'seconds': 104_520, 'minutes': 1742}
        untested_label = TestStatuses.UNTESTED.label.lower()
        with allure.step(f'Generate {number_of_cases} test cases'):
            case_ids = [test_case_factory(estimate=estimates['seconds']).id for _ in range(number_of_cases)]
            assert TestCase.objects.count() == number_of_cases
        with allure.step('Add cases to test plan'):
            superuser_client.send_request(
                self.view_name_detail,
                data={'test_cases': case_ids},
                expected_status=HTTPStatus.OK,
                request_type=RequestType.PATCH,
                reverse_kwargs={'pk': test_plan.id},
            )
        with allure.step('Request statics'):
            content = superuser_client.send_request(
                self.view_name_statistics,
                reverse_kwargs={'pk': test_plan.id},
            ).json()
        label_to_stat = {}
        estimates_to_stat = {}
        with allure.step('Validate statistics before update'):
            for elem in content:
                label_to_stat[elem['label'].lower()] = elem['value']
                estimates_to_stat[elem['label'].lower()] = elem['estimates']

            assert label_to_stat[untested_label] == number_of_cases, 'Incorrect statistics before update'
            assert estimates_to_stat[untested_label] == estimates['minutes'] * number_of_cases, \
                'Incorrect estimate before update'
        with allure.step(f'Update test plan with {new_number_of_cases} cases'):
            superuser_client.send_request(
                self.view_name_detail,
                data={'test_cases': case_ids[:new_number_of_cases]},
                expected_status=HTTPStatus.OK,
                request_type=RequestType.PATCH,
                reverse_kwargs={'pk': test_plan.id},
            )
        with allure.step('Validate statistics after update'):

            content = superuser_client.send_request(
                self.view_name_statistics,
                reverse_kwargs={'pk': test_plan.id},
            ).json()
            label_to_stat = {}
            estimates_to_stat = {}
            for elem in content:
                label_to_stat[elem['label'].lower()] = elem['value']
                estimates_to_stat[elem['label'].lower()] = elem['estimates']

            assert label_to_stat[untested_label] == new_number_of_cases, 'Incorrect statistics after update'
            assert estimates_to_stat[untested_label] == estimates['minutes'] * new_number_of_cases, \
                'Incorrect estimate after update'

    @pytest.mark.parametrize(
        'label_names, not_label_names, labels_condition, number_of_items',
        [
            (('blue_bank', 'green_bank'), None, 'or', 7),
            (('blue_bank', 'green_bank'), None, 'and', 2),
            (('blue_bank',), ('green_bank',), 'or', 8),
            (('blue_bank',), ('green_bank',), 'and', 3),
            (('blue_bank', 'red_bank'), ('green_bank',), 'or', 8),
            (('blue_bank', 'red_bank'), ('green_bank',), 'and', 0),
            (None, ('blue_bank',), 'or', 5),
            (None, ('blue_bank', 'green_bank'), 'or', 8),
            (None, ('blue_bank', 'green_bank'), 'and', 3),
        ],
    )
    def test_statistic_with_labels(
        self,
        superuser_client,
        cases_with_labels,
        label_names,
        not_label_names,
        labels_condition,
        number_of_items,
    ):
        title = 'Test statistics for{0}{1} with condition {2}'
        allure.dynamic.title(
            title.format(
                ' ' + ', '.join(label_names) if label_names else '',
                ' ' + ', '.join(not_label_names) if not_label_names else '',
                labels_condition,
            ),
        )
        labels, cases, test_plan = cases_with_labels
        query_params = {}
        if label_names:
            query_params['labels'] = self._label_query_params(label_names)
        if not_label_names:
            query_params['not_labels'] = self._label_query_params(not_label_names)
        query_params['labels_condition'] = labels_condition
        content = superuser_client.send_request(
            self.view_name_statistics,
            reverse_kwargs={'pk': test_plan.id},
            query_params=query_params,
        ).json()
        assert content[0]['value'] == number_of_items

    @pytest.mark.parametrize(
        'attribute, attr_values',
        [
            (None, None),
            ('run_id', ['first_value', 'second_value']),
        ],
        ids=['by date', 'by attribute'],
    )
    def test_histogram(
        self,
        superuser_client,
        test_plan,
        test_factory,
        test_result_factory,
        attribute,
        attr_values,
        request,
    ):
        allure.dynamic.title(f'Test histogram aggregation {request.node.callspec.id}')
        number_of_statuses = {
            0: 6,
            1: 12,
            2: 4,
            3: 10,
            4: 0,
            6: 16,
        }
        end_date = timezone.now()
        start_date = end_date - timezone.timedelta(days=1)
        if attribute:
            expected_results = [{'point': attr_value} for attr_value in attr_values]
        else:
            expected_results = [
                {'point': start_date.strftime('%Y-%m-%d')},
                {'point': end_date.strftime('%Y-%m-%d')},
            ]

        statuses = ((obj.value, obj.label) for obj in TestStatuses if obj != TestStatuses.UNTESTED)
        for status_key, status_value in statuses:
            for _ in range(int(number_of_statuses[status_key] / 2)):
                attributes = {attribute: attr_values[0]} if attribute else {}
                test_result_factory(
                    test=test_factory(plan=test_plan),
                    status=status_key,
                    created_at=start_date,
                    attributes=attributes,
                )
                if expected_results[0].get(status_value.lower()):
                    expected_results[0][status_value.lower()] += 1
            for _ in range(int(number_of_statuses[status_key] / 2)):
                attributes = {attribute: attr_values[1]} if attribute else {}
                test_result_factory(
                    test=test_factory(plan=test_plan),
                    status=status_key,
                    created_at=end_date,
                    attributes=attributes,
                )
                if expected_results[1].get(status_value.lower()):
                    expected_results[1][status_value.lower()] += 1

        content = superuser_client.send_request(
            self.view_name_histogram,
            reverse_kwargs={'pk': test_plan.id},
            query_params={
                'start_date': start_date.date(),
                'end_date': end_date.date(),
                'attribute': attribute if attribute else '',
            },
            expected_status=HTTPStatus.OK,
        ).json()
        assert len(expected_results) == len(content), 'Expected result did not match result'
        for idx in range(len(expected_results)):
            for key, value in expected_results[idx].items():
                point = expected_results[idx]['point']
                value_from_response = content[idx][key]
                assert value == value_from_response, (
                    f'Expect in point = {point}, '
                    f'{key} = {value}, get value = {value_from_response}'
                )

    @pytest.mark.parametrize(
        'label_names, not_label_names, labels_condition, number_of_items',
        [
            (('blue_bank', 'green_bank'), None, 'or', 7),
            (('blue_bank', 'green_bank'), None, 'and', 2),
            (('blue_bank',), ('green_bank',), 'or', 8),
            (('blue_bank',), ('green_bank',), 'and', 3),
            (('blue_bank', 'red_bank'), ('green_bank',), 'or', 8),
            (('blue_bank', 'red_bank'), ('green_bank',), 'and', 0),
            (None, ('blue_bank',), 'or', 5),
            (None, ('blue_bank', 'green_bank'), 'or', 8),
            (None, ('blue_bank', 'green_bank'), 'and', 3),
        ],
    )
    def test_histogram_with_labels(
        self,
        superuser_client,
        cases_with_labels,
        label_names,
        not_label_names,
        labels_condition,
        number_of_items,
    ):
        labels, cases, test_plan = cases_with_labels
        now_date = timezone.now().date()
        query_params = {
            'start_date': now_date,
            'end_date': now_date,
            'labels_condition': labels_condition,
        }
        title = 'Test statistics for{0}{1} with condition {2}'
        allure.dynamic.title(
            title.format(
                ' ' + ', '.join(label_names) if label_names else '',
                ' ' + ', '.join(not_label_names) if not_label_names else '',
                labels_condition,
            ),
        )
        if label_names:
            query_params['labels'] = self._label_query_params(label_names)
        if not_label_names:
            query_params['not_labels'] = self._label_query_params(not_label_names)
        content = superuser_client.send_request(
            self.view_name_histogram,
            reverse_kwargs={'pk': test_plan.id},
            query_params=query_params,
            expected_status=HTTPStatus.OK,
        ).json()
        assert len(content), 'Get empty histogram data'
        actual_result_value = content[-1][TestStatuses.PASSED.label.lower()]
        assert actual_result_value == number_of_items, f'Expected {number_of_items} results, got {actual_result_value}'

    @allure.title('Test plan cannot be parent to itself')
    def test_child_parent_logic(self, superuser_client, test_plan_factory):
        parent = test_plan_factory()
        child = test_plan_factory(parent=parent)
        superuser_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': parent.id},
            data={'parent': child.id},
            request_type=RequestType.PATCH,
            expected_status=HTTPStatus.BAD_REQUEST,
        )

    def test_search(
        self,
        api_client,
        authorized_superuser,
        test_plan_with_parameters_factory,
        parameter_factory,
        project,
    ):
        parameters = [parameter_factory(project=project) for _ in range(2)]
        root_plan = test_plan_with_parameters_factory(project=project)
        inner_plan = test_plan_with_parameters_factory(parent=root_plan, project=project)
        test_plan_with_parameters_factory(parent=root_plan, project=project)
        expected_plans = []
        expected_plans2 = []
        search_name = 'search_name'
        with allure.step('Generate plans that will be found'):
            for _ in range(int(constants.NUMBER_OF_OBJECTS_TO_CREATE / 2)):
                expected_plans.append(
                    test_plan_with_parameters_factory(
                        parent=inner_plan,
                        name=search_name,
                        project=project,
                    ),
                )
        with allure.step('Generate plans that will not be found'):
            for _ in range(int(constants.NUMBER_OF_OBJECTS_TO_CREATE / 2)):
                expected_plans2.append(
                    test_plan_with_parameters_factory(parent=inner_plan, parameters=parameters, project=project),
                )
        root_qs = self._get_search_qs_by_expected(expected_plans)
        expected_output = model_to_dict_via_serializer(
            root_qs,
            TestPlanTreeSerializer,
            many=True,
            as_json=True,
        )
        with allure.step('Validate only valid options are returned'):
            actual_data = api_client.send_request(
                self.view_name_list,
                query_params={'project': project.id, 'search': search_name, 'treeview': 1, 'ordering': 'created_at'},
            ).json_strip(as_json=True)
            assert actual_data == expected_output, 'Only objects with searched named and their ' \
                                                   'ancestors should be in treeview'
        with allure.step('Validate returned options are not all options'):
            actual_data = api_client.send_request(
                self.view_name_list,
                query_params={'project': project.id, 'treeview': 1},
            ).json_strip(as_json=True)
            assert actual_data != expected_output, 'List view and search are same.'

        with allure.step('Validate search by parameters'):
            actual_data = api_client.send_request(
                self.view_name_list,
                query_params={
                    'project': project.id,
                    'search': ' '.join([parameter.data for parameter in parameters]),
                    'treeview': 1,
                },
            ).json_strip(as_json=True)
            expected_output = model_to_dict_via_serializer(
                self._get_search_qs_by_expected(expected_plans2),
                TestPlanTreeSerializer,
                many=True,
                as_json=True,
            )
            assert actual_data == expected_output, 'Parameters search got more elements than expected.'

        with allure.step('Validate search with non-existent parameter returns empty body'):
            actual_data = api_client.send_request(
                self.view_name_list,
                query_params={
                    'project': project.id,
                    'search': 'non-existent',
                    'treeview': 1,
                },
            ).json_strip()
            assert not actual_data, 'Non-existent search argument got output.'

    @allure.title('Test plan activity view')
    def test_activity(
        self,
        superuser_client,
        test_plan_factory,
        test_factory,
        test_result_factory,
        user_factory,
    ):
        parent_plan = test_plan_factory()
        inner_plan = test_plan_factory(parent=parent_plan)
        plan = test_plan_factory(parent=inner_plan)
        test = test_factory(plan=plan)
        users_list = []
        result_list = []
        with allure.step('Create results by "Vasily Testovich{idx}" users'):
            for idx in range(int(constants.NUMBER_OF_OBJECTS_TO_CREATE / 2)):
                user = user_factory(first_name='Vasily', last_name=f'Testovich{idx}')
                users_list.append(user)
                result_list.append(test_result_factory(user=user, status=0, test=test))
        with allure.step('Create results by "Yana Albertovna{idx}" users with shifted result date'):
            for idx in range(int(constants.NUMBER_OF_OBJECTS_TO_CREATE / 2)):
                user = user_factory(first_name='Yana', last_name=f'Albertovna{idx}')
                users_list.append(user)
                result = test_result_factory(user=user, status=1, test=test)
                with mock.patch(
                    'django.utils.timezone.now',
                    return_value=result.created_at + timezone.timedelta(days=3),
                ):
                    result.save()
        body = superuser_client.send_request(
            self.view_name_activity,
            reverse_kwargs={'pk': parent_plan.id},
        ).json_strip()
        with allure.step('Validate results are split in 2 dates'):
            assert len(body) == 2, 'We expect history events in two different dates.'
        with allure.step('Validate breadcrumbs titles'):
            for date in body.values():
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
        ],
    )
    def test_activity_filters(
        self,
        superuser_client,
        filter_name,
        filter_values,
        generate_historical_objects,
    ):
        allure.dynamic.title(f'Test filter by {filter_name}')
        parent_plan = generate_historical_objects
        for filter_value in filter_values:
            with allure.step(f'Validate filter by {filter_value}'):
                args, number_of_objects = filter_value
                response = superuser_client.send_request(
                    self.view_name_activity,
                    reverse_kwargs={'pk': parent_plan.id},
                    query_params={filter_name: args},
                ).json()
                assert number_of_objects == response['count']

    @pytest.mark.parametrize('ordering', ['history_user', 'test__case__name', 'history_date', 'history_type'])
    def test_activity_ordering(self, superuser_client, generate_historical_objects, ordering):
        allure.dynamic.title(f'Test ordering by {ordering}')
        parent_plan = generate_historical_objects
        for sign in ['', '-']:
            with allure.step(f'Validate {"asc" if sign else "desc"} ordering'):
                results = TestResult.history.filter().order_by('history_date', f'{sign}{ordering}')
                results = list(results)
                content = superuser_client.send_request(
                    self.view_name_activity, reverse_kwargs={'pk': parent_plan.id},
                    query_params={'ordering': f'history_date, {sign}{ordering}'},
                ).json()
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
            ('non-existent', 0),
        ],
    )
    def test_search_filter(
        self, superuser_client, generate_historical_objects, search_data,
        number_of_objects,
    ):
        allure.dynamic.title(f'Test activity search filter by {search_data}')
        parent_plan = generate_historical_objects
        response = superuser_client.send_request(
            self.view_name_activity,
            reverse_kwargs={'pk': parent_plan.id},
            query_params={'search': search_data},
        ).json()
        assert response['count'] == number_of_objects, 'Number of found objects did not match.'

    @pytest.mark.parametrize('nesting_level', [0, 1])
    def test_archived_parent_forbidden(self, superuser_client, test_plan_factory, nesting_level):
        allure.dynamic.title(f'Test choosing archived plan as parent is forbidden for nesting level {nesting_level}')
        plan_to_update = test_plan_factory()
        parent = test_plan_factory(is_archive=True)
        for _ in range(nesting_level):
            parent = test_plan_factory(parent=parent)
        superuser_client.send_request(
            self.view_name_list,
            request_type=RequestType.POST,
            expected_status=HTTPStatus.BAD_REQUEST,
        )
        superuser_client.send_request(
            self.view_name_detail,
            reverse_kwargs={'pk': plan_to_update.pk},
            request_type=RequestType.PATCH,
            data={'parent': parent.pk},
            expected_status=HTTPStatus.BAD_REQUEST,
        )

    @allure.title('Test case ids display by test plan')
    def test_cases_by_plan_id(self, superuser_client, test_factory, test_plan_factory):
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
            Test.objects.filter(plan=inner_plan_lvl_2),
        ]
        for plan in plans:
            test_factory(plan=plan)
        with allure.step('Validate nested plans cases displayed'):
            for plan, expected_qs in zip(plans, expected_qs):
                case_ids = superuser_client.send_request(
                    self.view_name_case_ids,
                    reverse_kwargs={'pk': plan.id},
                ).json()['case_ids']
                assert case_ids == [test.case.id for test in expected_qs.order_by('case__id')]
        with allure.step('Validate nested plans cases not displayed with include_children=False'):
            for plan in plans:
                case_ids = superuser_client.send_request(
                    self.view_name_case_ids,
                    reverse_kwargs={'pk': plan.id},
                    query_params={'include_children': False},
                ).json()['case_ids']
                assert case_ids == [test.case.id for test in Test.objects.filter(plan=plan).order_by('case__id')]

    @pytest.mark.parametrize('to_plan', [True, False])
    def test_plan_copying_with_dst_plan(
        self,
        superuser_client,

        test_plan_factory,
        project,
        test_factory,
        to_plan,
    ):
        title = 'Test plan copying {0}'
        allure.dynamic.title(
            title.format('destination plan specified' if to_plan else 'destination plan not specified'),
        )
        tests_to_copy = []
        plans_to_copy = []
        excluded_fields_plan = ['tree_id', 'id', 'parent', 'finished_at']
        root_plan = test_plan_factory(project=project)
        plans_to_copy.append(root_plan)
        tests_to_copy.append(test_factory(project=project, plan=root_plan))
        nested_plan = test_plan_factory(project=project, parent=root_plan)
        plans_to_copy.append(nested_plan)
        tests_to_copy.append(test_factory(project=project, plan=nested_plan))
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            plan = test_plan_factory(project=project, parent=nested_plan)
            plans_to_copy.append(plan)
            tests_to_copy.append(test_factory(project=project, plan=plan))
        payload = {
            'plans': [
                {
                    'plan': root_plan.pk,
                },
            ],
            'keep_assignee': True,
        }
        if to_plan:
            dst_plan = test_plan_factory(project=project)
            payload['dst_plan'] = dst_plan.pk
            excluded_fields_plan.append('level')
        copied_plans_from_resp = superuser_client.send_request(
            self.view_name_copy,
            request_type=RequestType.POST,
            data=payload,
        ).json()
        copied_plans_ids = [plan['id'] for plan in copied_plans_from_resp]
        copied_plans = list(TestPlan.objects.filter(Q(pk__in=copied_plans_ids)))
        copied_tests = list(Test.objects.filter(Q(plan__pk__in=copied_plans_ids)))
        self._validate_copied_objects(
            sorted(plans_to_copy, key=attrgetter('id')),
            sorted(copied_plans, key=attrgetter('id')),
            excluded_fields=excluded_fields_plan,
        )
        self._validate_copied_objects(
            sorted(tests_to_copy, key=attrgetter('id')),
            sorted(copied_tests, key=attrgetter('id')),
            excluded_fields=['id', 'plan'],
        )

    @pytest.mark.parametrize('attribute_name', ['name', 'started_at', 'due_date'])
    def test_plan_copying_attr_changed(
        self,
        superuser_client,

        test_plan_factory,
        project,
        attribute_name,
    ):
        plan_to_copy = test_plan_factory(project=project)
        plan_payload = {
            'plan': plan_to_copy.pk,
        }
        if attribute_name == 'name':
            plan_payload['new_name'] = 'New name'
        else:
            plan_payload[attribute_name] = timezone.now().isoformat()
        copied_plan_id = superuser_client.send_request(
            self.view_name_copy,
            request_type=RequestType.POST,
            data={
                'plans': [
                    plan_payload,
                ],
            },
        ).json()[0]['id']
        assert getattr(plan_to_copy, attribute_name) != getattr(TestPlan.objects.get(pk=copied_plan_id), attribute_name)

    def test_plan_not_keep_assignee(
        self,
        superuser_client,

        test_plan_factory,
        project,
        test_factory,
    ):
        plan_to_copy = test_plan_factory(project=project)
        test_to_copy = test_factory(plan=plan_to_copy)
        copied_plan_id = superuser_client.send_request(
            self.view_name_copy,
            request_type=RequestType.POST,
            data={
                'plans': [
                    {
                        'plan': plan_to_copy.pk,
                    },
                ],
                'keep_assignee': False,
            },
        ).json()[0]['id']
        copied_test = Test.objects.filter(plan__pk=copied_plan_id).first()
        assert test_to_copy.assignee != copied_test.assignee
        assert copied_test.assignee is None

    def test_plan_copying_to_itself(
        self,
        superuser_client,
        test_plan_factory,
        project,
    ):
        plan_to_copy = test_plan_factory(project=project)
        plan_payload = {
            'plan': plan_to_copy.pk,
        }
        superuser_client.send_request(
            self.view_name_copy,
            request_type=RequestType.POST,
            data={
                'plans': [plan_payload],
                'dst_plan': plan_to_copy.pk,
            },
            expected_status=HTTPStatus.OK,
        ).json()
        plan_to_copy.refresh_from_db()
        assert plan_to_copy.get_descendants(include_self=False).count()

    def test_copy_plan_not_keeping_comments(
        self,
        superuser_client,

        test_plan_factory,
        project,
        test_factory,
        comment_test_factory,
        comment_test_plan_factory,
    ):
        plan_to_copy = test_plan_factory(project=project)
        comment_test_plan_factory(content_object=plan_to_copy)
        test_to_copy = test_factory(plan=plan_to_copy)
        comment_test_factory(content_object=test_to_copy)
        copied_plan_id = superuser_client.send_request(
            self.view_name_copy,
            request_type=RequestType.POST,
            data={
                'plans': [
                    {
                        'plan': plan_to_copy.pk,
                    },
                ],
                'keep_assignee': False,
            },
        ).json()[0]['id']
        copied_plan = TestPlan.objects.get(pk=copied_plan_id)
        copied_test = Test.objects.filter(plan__pk=copied_plan_id).first()
        assert not copied_plan.comments.all()
        assert not copied_test.comments.all()

    @pytest.mark.parametrize(
        'attribute, attr_values, to_str',
        [
            ('run_id', ['first_value', 'second_value', 14], True),
            ('run_id', [125, 98, 14], False),
        ],
        ids=['Histogram by date', 'Histogram by attribute'],
    )
    def test_histogram_ordering(
        self, superuser_client, test_plan,
        test_factory, test_result_factory,
        attribute, attr_values, to_str,
    ):
        if to_str:
            def value_to_str(obj):
                return str(obj)

            expected_ordering = sorted(attr_values, key=value_to_str)
        else:
            expected_ordering = sorted(attr_values)
        for idx in range(len(attr_values)):
            test_result_factory(
                test=test_factory(plan=test_plan),
                status=TestStatuses.PASSED,
                attributes={attribute: attr_values[idx]},
            )
        content = superuser_client.send_request(
            self.view_name_histogram,
            reverse_kwargs={'pk': test_plan.id},
            query_params={
                'start_date': (timezone.now() - timezone.timedelta(days=1)).date(),
                'end_date': (timezone.now() + timezone.timedelta(days=1)).date(),
                'attribute': attribute,
            },
            expected_status=HTTPStatus.OK,
        ).json()
        assert expected_ordering == [obj['point'] for obj in content], 'Wrong ordering'

    @allure.title('Test test plan creation with archived cases')
    def test_creation_with_archive_cases(
        self,
        superuser_client,
        project,
        test_case_factory,
    ):
        test_cases = [test_case_factory(is_archive=True).pk for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE)]
        testplan_dict = {
            'name': 'Test plan',
            'due_date': constants.END_DATE,
            'started_at': constants.DATE,
            'test_cases': test_cases,
            'project': project.id,
        }
        response = superuser_client.send_request(
            self.view_name_list,
            testplan_dict,
            HTTPStatus.BAD_REQUEST,
            RequestType.POST,
        )
        with allure.step('validate response'):
            assert TestPlanCasesValidator.err_msg.format(test_cases) in response.json()['errors']

    @classmethod
    @allure.step('Validate copied objects')
    def _validate_copied_objects(
        cls,
        src_instances: list[Any],
        copied_instances: list[Any],
        excluded_fields: Iterable[str],
    ) -> None:
        err_msg = 'Value for field {0} did not change for instance {1}'
        assert len(src_instances) == len(copied_instances)
        for src_instance, copied_instance in zip(src_instances, copied_instances):
            src_data = model_to_dict(src_instance, exclude=excluded_fields)
            copied_data = model_to_dict(copied_instance, exclude=excluded_fields)
            assert src_data == copied_data, f'Invalid data copied for {type(src_instance[0])}'

        for src_instance, copied_instance in zip(src_instances, copied_instances):
            for field in excluded_fields:
                src_val = getattr(src_instance, field)
                copied_val = getattr(copied_instance, field)
                if src_val is None:
                    continue
                assert src_val != copied_val, err_msg.format(field, type(src_instance[0]))

    @classmethod
    def _label_query_params(cls, label_names: Iterable[str]) -> str:
        return ','.join(map(str, Label.objects.filter(name__in=label_names).values_list('id', flat=True)))

    @classmethod
    @allure.step('Limit testplans by only expected and their ancestors')
    def _get_search_qs_by_expected(cls, expected_plans: Iterable[TestPlan]) -> QuerySet[TestPlan]:
        pref_qs = TestPlan.objects.filter(pk__in=(plan.id for plan in expected_plans)).get_ancestors(include_self=True)
        max_level = TPSelector().get_max_level()
        return deepcopy(pref_qs).filter(parent=None).prefetch_related(
            *form_tree_prefetch_objects(
                'child_test_plans',
                'child_test_plans',
                max_level,
                queryset=pref_qs,
            ),
        )

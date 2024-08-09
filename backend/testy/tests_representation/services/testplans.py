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
from itertools import product
from typing import Any, Iterable

from django.db import transaction

from testy.tests_representation.models import Parameter, TestPlan
from testy.tests_representation.services.tests import TestService
from testy.utilities.sql import get_next_max_int_value, lock_table, rebuild_mptt

_TEST_CASES = 'test_cases'
_PARENT = 'parent'


class TestPlanService:
    non_side_effect_fields = [
        'name', _PARENT, 'started_at', 'due_date', 'finished_at', 'is_archive', 'project', 'description',
    ]

    @transaction.atomic
    def testplan_create(self, data: dict[str, Any]) -> list[TestPlan]:
        with lock_table(TestPlan):
            test_plan = TestPlan.model_create(fields=self.non_side_effect_fields, data=data)
            parent = data.get(_PARENT) if data.get(_PARENT) else test_plan
            TestPlan.objects.partial_rebuild(parent.tree_id)
        if test_cases := data.get(_TEST_CASES, []):
            TestService().bulk_test_create([test_plan], test_cases)
        return test_plan

    @transaction.atomic
    def testplan_bulk_create(self, data: dict[str, Any]) -> list[TestPlan]:
        parameters = data.get('parameters')
        parameter_combinations = self._parameter_combinations(parameters)
        created_plans = []

        parent_tree_id = None
        if parent := data.get(_PARENT):
            parent_tree_id = parent.tree_id

        with lock_table(TestPlan):
            num_of_combinations = len(parameter_combinations)
            for _ in range(num_of_combinations):
                test_plan_object: TestPlan = TestPlan.model_create(
                    fields=self.non_side_effect_fields,
                    data=data,
                    commit=False,
                )
                test_plan_object.lft = 0
                test_plan_object.rght = 0
                test_plan_object.tree_id = parent_tree_id or get_next_max_int_value(TestPlan, 'tree_id')
                test_plan_object.level = 0
                created_plans.append(test_plan_object)

            created_plans = TestPlan.objects.bulk_create(created_plans)

            for plan, combined_parameters in zip(created_plans, parameter_combinations):
                plan.parameters.set(combined_parameters)

            if parent_tree_id:
                rebuild_mptt(TestPlan, parent.tree_id)
            else:
                for test_plan in created_plans:
                    rebuild_mptt(TestPlan, test_plan.tree_id)

        if test_cases := data.get('test_cases', []):
            TestService().bulk_test_create(created_plans, test_cases)
        return created_plans

    @transaction.atomic
    def testplan_update(self, *, test_plan: TestPlan, data: dict[str, Any]) -> TestPlan:
        with lock_table(TestPlan):
            test_plan, _ = test_plan.model_update(
                fields=self.non_side_effect_fields,
                data=data,
            )
            TestPlan.objects.partial_rebuild(test_plan.tree_id)

        if (test_cases := data.get(_TEST_CASES)) is not None:  # test_cases may be empty list
            old_test_case_ids = set(TestService().get_testcase_ids_by_testplan(test_plan))
            new_test_case_ids = {tc.id for tc in test_cases}

            # deleting tests
            if delete_test_case_ids := old_test_case_ids - new_test_case_ids:
                TestService().test_delete_by_test_case_ids(test_plan, delete_test_case_ids)

            # creating tests
            if create_test_case_ids := new_test_case_ids - old_test_case_ids:
                cases = [tc for tc in data[_TEST_CASES] if tc.id in create_test_case_ids]
                TestService().bulk_test_create((test_plan,), cases)
        return test_plan

    def testplan_delete(self, *, test_plan) -> None:
        test_plan.delete()

    @classmethod
    def _parameter_combinations(cls, parameters: Iterable[Parameter]) -> list[tuple[Parameter, ...]]:
        """
        Return all possible combinations of parameters by group name.

        Args:
            parameters: list of Parameter objects.

        Returns:
             list of tuple of every possible combination of parameters.
        """
        group_parameters = {}

        for parameter in parameters:
            group_parameters.setdefault(parameter.group_name, []).append(parameter)

        return list(product(*group_parameters.values()))

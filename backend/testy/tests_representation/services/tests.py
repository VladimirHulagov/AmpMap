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

from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone
from simple_history.utils import bulk_update_with_history
from tests_representation.services.results import TestResultService

from testy.core.models import Project
from testy.root.celery import app
from testy.tests_description.models import TestCase
from testy.tests_representation.models import Test, TestPlan, TestResult
from testy.tests_representation.selectors.tests import TestSelector
from testy.users.models import User

channel_layer = get_channel_layer()

_PLAN_ID = 'plan_id'


class TestService:
    non_side_effect_fields = [
        'case',
        'plan',
        'assignee',
        'is_archive',
        'project',
        'assignee_id',
        _PLAN_ID,
        'is_deleted',
        'deleted_at',
    ]

    def test_create(self, data: dict[str, Any]) -> Test:
        test = Test.model_create(
            fields=self.non_side_effect_fields,
            data=data,
            commit=False,
        )
        test.project = test.case.project
        test.full_clean()
        test.save()
        return test

    @transaction.atomic
    def bulk_test_create(self, test_plans: list[TestPlan], cases: QuerySet[TestCase]):
        test_objects = [  # noqa: WPS361
            self._make_test_model({'case': case, 'plan': tp, 'project': tp.project}) for tp in test_plans
            for case in cases
        ]
        return Test.objects.bulk_create(test_objects)

    def test_update(
        self,
        test: Test,
        data: dict[str, Any],
        user: User,
        commit: bool = True,
        notify_user: bool = True,
    ) -> Test:
        old_assignee_id = test.assignee_id
        test, _ = test.model_update(
            fields=self.non_side_effect_fields,
            data=data,
            commit=commit,
        )
        if not notify_user:
            return test
        if assignee := data.get('assignee'):
            assignee = assignee.pk
        ct_id = ContentType.objects.get_for_model(test).pk
        self.notify_assignee(test, old_assignee_id, assignee, user.pk, ct_id)
        return test

    @transaction.atomic
    def bulk_update_tests(
        self,
        test_ids: list[int],
        payload: dict[str, Any],
        user_id: int,
        is_async: bool = False,
    ):
        tests = TestSelector.test_list_by_ids(test_ids)
        user = User.objects.get(pk=user_id)
        updated_tests = []
        test_to_old_assignee = {}
        for test in tests:
            test_to_old_assignee[test.pk] = test.assignee_id
            updated_tests.append(self.test_update(test, payload, commit=False, user=user, notify_user=False))

        if result := payload.pop('result', {}):
            task_kwargs = {
                'payload': result,
                'test_ids': test_ids,
                'user_id': user.pk,
            }
            TestResultService.result_bulk_create_from_api(**task_kwargs)
        if payload.get('is_deleted'):
            TestResult.objects.select_related('test').filter(test_id__in=tests).delete()
            payload['deleted_at'] = timezone.now()

        app.send_task(
            'testy.tests_representation.tasks.notify_bulk_assign',
            args=[
                test_to_old_assignee,
                payload.get('assignee_id', None),
                user.pk,
            ],
        )
        if payload.keys():
            bulk_update_with_history(
                updated_tests,
                Test,
                fields=payload.keys(),
                default_user=user,
                default_change_reason='Bulk update tests',
            )
        if is_async:
            self.produce_bulk_action(tests, user_id, user_id, 'bulk.tests')
        qs = TestSelector.test_list_by_ids(test_ids)
        return TestSelector().test_list_with_last_status(qs=qs)

    def get_testcase_ids_by_testplan(self, test_plan: TestPlan) -> QuerySet[int]:
        return test_plan.tests.values_list('case', flat=True)

    @classmethod
    def notify_assignee(
        cls,
        test: Test,
        old_assignee_id: int | None,
        new_assignee_id: int | None,
        actor_id: int,
        ct_id: int,
    ) -> None:
        if old_assignee_id and new_assignee_id != old_assignee_id:
            cls.produce_action(test, old_assignee_id, actor_id, 'test.unassigned', ct_id)
        if new_assignee_id:
            cls.produce_action(test, new_assignee_id, actor_id, 'test.assigned', ct_id)

    @classmethod
    def produce_action(
        cls,
        test: Test,
        receiver_id: int,
        actor_id: int,
        action_type: str,
        content_type_id: int,
    ) -> None:
        async_to_sync(channel_layer.send)(
            'notifications',
            {
                'type': action_type,
                'object_id': test.pk,
                'content_type_id': content_type_id,
                'receiver_id': receiver_id,
                'actor_id': actor_id,
                'project_id': test.project.pk,
                _PLAN_ID: test.plan.pk,
                'name': test.case.name,
            },
        )

    @classmethod
    def produce_bulk_action(
        cls,
        tests: QuerySet[Test],
        receiver_id: int,
        actor_id: int,
        action_type: str,
    ) -> None:
        additional_data = {}
        plans_count = (
            tests
            .values_list(_PLAN_ID, flat=True)
            .distinct(_PLAN_ID)
            .order_by(_PLAN_ID)
            .count()
        )
        if plans_count > 1:
            notify_object = tests.first().project
            content_type_id = ContentType.objects.get_for_model(Project).pk
            additional_data['placeholder_text'] = f'in project {notify_object.name}'
            additional_data['placeholder_link'] = f'/projects/{notify_object.id}/plans'
        else:
            notify_object = tests.first().plan
            content_type_id = ContentType.objects.get_for_model(TestPlan).pk
            additional_data['placeholder_text'] = f'in test plan {notify_object.name}'
            additional_data['placeholder_link'] = f'/projects/{notify_object.project_id}/plans/{notify_object.id}'
        async_to_sync(channel_layer.send)(
            'notifications',
            {
                'type': action_type,
                'object_id': notify_object.id,
                'content_type_id': content_type_id,
                'receiver_id': receiver_id,
                'actor_id': actor_id,
                **additional_data,
            },
        )

    def _make_test_model(self, data):
        return Test.model_create(
            fields=self.non_side_effect_fields,
            data=data,
            commit=False,
        )

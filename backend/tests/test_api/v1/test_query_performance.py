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
from unittest import mock

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from tests import constants


@pytest.mark.django_db
class TestNumberOfQueries:
    max_num_of_queries_treeview = 40
    max_num_of_queries = 30
    max_num_of_queries_detailed = 20

    @pytest.mark.parametrize('treeview', [0, 1], ids=['treeview disabled', 'treeview enabled'])
    def test_list_views_queries_num(self, api_client, authorized_superuser, treeview, generate_objects, project):
        query_params = {
            'treeview': treeview,
            'project': project.id
        }
        for view_name in constants.LIST_VIEW_NAMES.values():
            with CaptureQueriesContext(connection) as context:
                api_client.send_request(view_name, query_params=None if 'project' in view_name else query_params)
                num_of_queries = len(context.captured_queries)
                assert num_of_queries <= self.max_num_of_queries_treeview if treeview else self.max_num_of_queries, \
                    f'Number of queries in {view_name} is exceeding allowed maximum.\n' \
                    f'Number of queries: "{num_of_queries}"'

    @pytest.mark.django_db(reset_sequences=True)
    def test_detail_views_queries_num(self, api_client, authorized_superuser, generate_objects):
        for view_name in constants.DETAIL_VIEW_NAMES.values():
            with CaptureQueriesContext(connection) as context:
                api_client.send_request(view_name, reverse_kwargs={'pk': 1})
                num_of_queries = len(context.captured_queries)
                assert num_of_queries <= self.max_num_of_queries_detailed, f'Number of queries in {view_name} ' \
                                                                           f'is exceeding allowed maximum.\n' \
                                                                           f'Number of queries: "{num_of_queries}"'

    def test_project_progress_queries(self, api_client, project, authorized_superuser, test_factory,
                                      test_result_factory, test_plan_factory):
        plan = test_plan_factory(project=project, parent=test_plan_factory(project=project))
        with mock.patch(
                'django.utils.timezone.now',
                return_value=timezone.make_aware(timezone.datetime(2000, 1, 2), timezone.utc)
        ):
            for _ in range(5):
                test_result_factory(test=test_factory(plan=plan), project=project)

        start, end = timezone.datetime(2000, 1, 1), timezone.datetime(2000, 1, 3)

        with CaptureQueriesContext(connection) as context:
            api_client.send_request(
                'api:v1:project-progress',
                reverse_kwargs={'pk': project.pk},
                query_params={
                    'start_date': start.isoformat(),
                    'end_date': end.isoformat(),
                },
            )
            first_num_of_queries = len(context.captured_queries)
        plan = test_plan_factory(project=project, parent=test_plan_factory(project=project))
        with mock.patch(
                'django.utils.timezone.now',
                return_value=timezone.make_aware(timezone.datetime(2000, 1, 2), timezone.utc)
        ):
            for _ in range(5):
                test_result_factory(test=test_factory(plan=plan), project=project)
        with CaptureQueriesContext(connection) as context:
            api_client.send_request(
                'api:v1:project-progress',
                reverse_kwargs={'pk': project.pk},
                query_params={
                    'start_date': start.isoformat(),
                    'end_date': end.isoformat(),
                },
            )
            second_num_of_queries = len(context.captured_queries)
        assert first_num_of_queries == second_num_of_queries, 'Number of queries grew with more instances'
        assert self.max_num_of_queries >= second_num_of_queries

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
from django.utils.decorators import method_decorator
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from swagger.common_query_parameters import (
    filter_param_by_id,
    is_archive_parameter,
    list_param_factory,
    ordering_param_factory,
    project_param,
    search_param_factory,
    treeview_param,
)
from swagger.custom_schema_generation import ResponseCodeTuple, TestyPaginatorInspector
from swagger.serializers import BreadcrumbsSerializer, CaseIdsSerializer

from testy.core.api.v1.serializers import LabelSerializer
from testy.tests_representation.api.v1.serializers import (
    TestPlanInputSerializer,
    TestPlanOutputSerializer,
    TestPlanProgressSerializer,
    TestPlanTreeSerializer,
    TestPlanUpdateSerializer,
    TestResultActivitySerializer,
)

plan_list_schema = method_decorator(
    name='list',
    decorator=swagger_auto_schema(
        manual_parameters=[
            is_archive_parameter,
            project_param,
            treeview_param,
            filter_param_by_id('parent_id'),
            ordering_param_factory('started_at', 'created_at', 'name'),
            search_param_factory('title'),
        ],
        responses={
            ResponseCodeTuple(status.HTTP_200_OK, 'treeview'): TestPlanTreeSerializer(many=True),
            ResponseCodeTuple(status.HTTP_200_OK, 'treeview with cases'): TestPlanOutputSerializer(many=True),
        },
        paginator_inspectors=[TestyPaginatorInspector],
    ),
)

plans_breadcrumbs_schema = swagger_auto_schema(
    operation_description='Get treelike breadcrumbs view from suite with id to root suite.',
    responses={
        status.HTTP_200_OK: BreadcrumbsSerializer,
    },
)

plan_activity_schema = swagger_auto_schema(
    operation_description='Get activity of test results by users for test plan and its nested ones.',
    manual_parameters=[
        list_param_factory('history_user'),
        list_param_factory('status'),
        list_param_factory('history_type', 'Options are: "+", "-", "~"'),
        list_param_factory('test'),
    ],
    responses={
        status.HTTP_200_OK: TestResultActivitySerializer(many=True),
    },
    paginator_inspectors=[TestyPaginatorInspector],
)

plan_labels_schema = swagger_auto_schema(
    operation_description='Get labels used in current test plan',
    responses={
        status.HTTP_200_OK: LabelSerializer(many=True),
    },
    paginator_inspectors=[TestyPaginatorInspector],
)

plan_case_ids_schema = swagger_auto_schema(
    operation_description='Get list of cases used in provided test plan',
    manual_parameters=[
        openapi.Parameter(
            'include_children',
            openapi.IN_QUERY,
            type=openapi.TYPE_BOOLEAN,
            description='Include child test plans case ids or not, True is set if not provided',
        ),
    ],
    responses={status.HTTP_200_OK: CaseIdsSerializer()},
)

plan_progress_schema = swagger_auto_schema(
    operation_description='Get testplan progress.',
    manual_parameters=[
        openapi.Parameter(
            'start_date',
            openapi.IN_QUERY,
            type=openapi.TYPE_STRING,
            description='start date in iso format',
        ),
        openapi.Parameter(
            'end_date',
            openapi.IN_QUERY,
            type=openapi.TYPE_STRING,
            description='end date in iso format',
        ),
    ],
    responses={
        status.HTTP_200_OK: TestPlanProgressSerializer(many=True),
    },
    tags=['statistics'],
)

plan_create_schema = swagger_auto_schema(
    request_body=TestPlanInputSerializer,
    responses={status.HTTP_201_CREATED: TestPlanOutputSerializer(many=True)},
)

plan_update_schema = swagger_auto_schema(
    request_body=TestPlanUpdateSerializer,
    responses={status.HTTP_201_CREATED: TestPlanOutputSerializer()},
)

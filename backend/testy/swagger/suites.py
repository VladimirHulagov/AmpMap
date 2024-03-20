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
    is_flat,
    ordering_param_factory,
    project_param,
    search_param_factory,
    treeview_param,
)
from swagger.custom_schema_generation import ResponseCodeTuple, TestyPaginatorInspector
from swagger.serializers import BreadcrumbsSerializer

from testy.tests_description.api.v1.serializers import (
    TestSuiteBaseSerializer,
    TestSuiteSerializer,
    TestSuiteTreeCasesSerializer,
    TestSuiteTreeSerializer,
)

show_cases_parameter = openapi.Parameter(
    'show_cases',
    openapi.IN_QUERY,
    description='Display test cases associated with suite or not.',
    type=openapi.TYPE_BOOLEAN,
)
treeview_response = openapi.Response(
    'Serializer for displaying tree structure of test suites.'
    'Children field is an list of instances of treeview serializer.',
    TestSuiteTreeSerializer(many=True),
)
treeview_with_cases_response = openapi.Response(
    'Serializer for displaying tree structure of test suites with test cases associated with suites.'
    'Children field is an list of instances of treeview serializer.',
    TestSuiteTreeCasesSerializer(many=True),
)
suite_breadcrumbs_response = openapi.Response(
    'Serializer for displaying breadcrumbs recursively.',
    BreadcrumbsSerializer(),
)

suite_list_schema = method_decorator(
    name='list',
    decorator=swagger_auto_schema(
        operation_description='Returns list of test suites in different formats, depending on parameters.',
        manual_parameters=[
            project_param,
            treeview_param,
            show_cases_parameter,
            is_flat,
            ordering_param_factory('name', 'descendant_count', 'total_estimates'),
            search_param_factory('name'),
        ],
        responses={
            ResponseCodeTuple(status.HTTP_200_OK, 'treeview'): treeview_response,
            ResponseCodeTuple(status.HTTP_200_OK, 'treeview with cases'): treeview_with_cases_response,
            ResponseCodeTuple(status.HTTP_200_OK, 'No parameters provided'): TestSuiteSerializer,
        },
        paginator_inspectors=[TestyPaginatorInspector],
    ),
)
suite_retrieve_schema = method_decorator(
    name='retrieve',
    decorator=swagger_auto_schema(
        operation_description='Returns list of test suites in different formats, depending on parameters.',
        manual_parameters=[treeview_param, show_cases_parameter],
        responses={
            ResponseCodeTuple(status.HTTP_200_OK, 'treeview'): TestSuiteTreeSerializer,
            ResponseCodeTuple(status.HTTP_200_OK, 'treeview with cases'): TestSuiteTreeCasesSerializer,
            ResponseCodeTuple(status.HTTP_200_OK, 'No parameters provided'): TestSuiteSerializer(many=True),
        },
    ),
)
suite_copy_schema = swagger_auto_schema(
    operation_description='Copy suites with provided ids and all its dependant objects '
                          'to another suite within a project. If project is not provided src suite project is used',
    responses={
        status.HTTP_200_OK: TestSuiteBaseSerializer(many=True),
    },
)

suites_breadcrumbs_schema = swagger_auto_schema(
    operation_description='Get treelike breadcrumbs view from suite with id to root suite.',
    responses={
        status.HTTP_200_OK: suite_breadcrumbs_response,
    },
)

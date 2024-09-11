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
from django.utils.decorators import method_decorator
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from swagger.common_query_parameters import (
    filter_param_by_id,
    is_archive_parameter,
    list_param_factory,
    ordering_param_factory,
    project_param,
    search_param_factory,
)
from swagger.custom_schema_generation import TestyPaginatorInspector

test_list_schema = method_decorator(
    name='list',
    decorator=swagger_auto_schema(
        manual_parameters=[
            is_archive_parameter,
            project_param,
            ordering_param_factory(
                'id',
                'case_name',
                'is_archive',
                'last_status',
                'assignee',
            ),
            search_param_factory('test case name from each test'),
            filter_param_by_id('assignee'),
            openapi.Parameter(
                'unassigned',
                openapi.IN_QUERY,
                type=openapi.TYPE_BOOLEAN,
                description='Filter by lack of assignee',
            ),
            list_param_factory('last_status'),
            list_param_factory('labels'),
            list_param_factory('not_labels', 'Exclude labels'),
            openapi.Parameter(
                'labels_condition',
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description='Condition for boolean logic for labels, options are: and/or',
            ),
        ],
        paginator_inspectors=[TestyPaginatorInspector],
    ),
)

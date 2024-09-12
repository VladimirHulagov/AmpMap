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
from collections import OrderedDict
from typing import NamedTuple

from drf_yasg import openapi
from drf_yasg.inspectors import PaginatorInspector, SwaggerAutoSchema
from drf_yasg.utils import force_real_str, force_serializer_instance
from rest_framework.status import is_success


class ResponseCodeTuple(NamedTuple):
    status_code: int
    description: str

    def __str__(self):
        return f'{self.status_code}, {self.description}'

    def __int__(self):
        return self.status_code


class TestyPaginatorInspector(PaginatorInspector):
    def get_paginated_response(self, paginator, response_schema):
        return openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties=OrderedDict(
                (
                    (
                        'links', openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties=OrderedDict(
                                (
                                    ('next', openapi.Schema(type=openapi.FORMAT_URI)),
                                    ('previous', openapi.Schema(type=openapi.FORMAT_URI)),
                                ),
                            ),
                        ),
                    ),
                    ('count', openapi.Schema(type=openapi.TYPE_INTEGER)),
                    (
                        'pages', openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties=OrderedDict(
                                (
                                    ('next', openapi.Schema(type=openapi.TYPE_INTEGER)),
                                    ('previous', openapi.Schema(type=openapi.TYPE_INTEGER)),
                                    ('current', openapi.Schema(type=openapi.TYPE_INTEGER)),
                                    ('total', openapi.Schema(type=openapi.TYPE_INTEGER)),
                                ),
                            ),
                        ),
                    ),
                    ('results', response_schema),
                )),
            required=['results'],
        )


class TestyAutoSchema(SwaggerAutoSchema):

    def get_tags(self, operation_keys=None):
        tags = self.overrides.get('tags', None) or getattr(self.view, 'schema_tags', [])
        if not tags:
            tags = [operation_keys[0]]

        return tags

    def get_response_serializers(self):
        """Reimplementation of base method so it works with several response schemas at once."""
        manual_responses = self.overrides.get('responses', None) or {}
        processed_manual_responses = OrderedDict()
        for sc, resp in manual_responses.items():
            if isinstance(sc, ResponseCodeTuple):
                processed_manual_responses[sc] = resp
                continue
            processed_manual_responses[str(sc)] = resp

        responses = OrderedDict()
        if not any(is_success(int(sc)) for sc in processed_manual_responses if sc != 'default'):
            responses = self.get_default_responses()

        responses.update((str(sc), resp) for sc, resp in processed_manual_responses.items())
        return responses

    def get_response_schemas(self, response_serializers):
        """Reimplemented method for pagination pickup for custom responses."""
        responses = OrderedDict()
        for sc, serializer in response_serializers.items():
            if isinstance(serializer, str):
                response = openapi.Response(
                    description=force_real_str(serializer),
                )
            elif not serializer:
                continue
            elif isinstance(serializer, openapi.Response):
                response = serializer
                if hasattr(response, 'schema') and not isinstance(response.schema, openapi.Schema.OR_REF):
                    serializer = force_serializer_instance(response.schema)
                    schema = self.serializer_to_schema(serializer)
                    if self.has_list_response():
                        schema = openapi.Schema(type=openapi.TYPE_ARRAY, items=schema)
                    if self.should_page():
                        schema = self.get_paginated_response(schema) or schema
                    response.schema = schema
            elif isinstance(serializer, openapi.Schema.OR_REF):
                response = openapi.Response(
                    description='',
                    schema=serializer,
                )
            elif isinstance(serializer, openapi._Ref):
                response = serializer
            else:
                serializer = force_serializer_instance(serializer)
                schema = self.serializer_to_schema(serializer)
                if self.has_list_response():
                    schema = openapi.Schema(type=openapi.TYPE_ARRAY, items=schema)
                if self.should_page():
                    schema = self.get_paginated_response(schema) or schema
                response = openapi.Response(
                    description='',
                    schema=schema,
                )
            responses[str(sc)] = response

        return responses

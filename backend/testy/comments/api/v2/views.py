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
from rest_framework import filters, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from testy.comments.api.v2.serializers import CommentCreateSerializer, CommentSerializer, InputBaseCommentSerializer
from testy.comments.exceptions import CommentParameterNotProvided
from testy.comments.filters import CommentFilter
from testy.comments.models import Comment
from testy.comments.paginations import CommentSetPagination
from testy.comments.selectors.comments import CommentSelector
from testy.comments.services.comment import CommentService
from testy.filters import TestyFilterBackend
from testy.swagger.v2.comments import comment_create_schema, comment_list_schema


@comment_list_schema
class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.none()
    serializer_class = CommentSerializer
    pagination_class = CommentSetPagination
    filter_backends = [TestyFilterBackend, filters.OrderingFilter]
    permission_classes = [IsAuthenticated]
    filterset_class = CommentFilter
    schema_tags = ['Comments']

    ordering = ('-created_at',)

    def get_serializer_class(self):
        if self.action == 'create':
            return CommentCreateSerializer
        if self.action == 'update':
            return InputBaseCommentSerializer
        return CommentSerializer

    def get_queryset(self):
        if self.action == 'list' and self.request.query_params.get('comment_id') is None:
            object_id = self.request.query_params.get('object_id')
            model_name = self.request.query_params.get('model')
            if object_id is None or model_name is None:
                raise CommentParameterNotProvided
        if self.action not in {'list', 'create'}:
            return CommentSelector.comment_list_by_user_id(self.request.user.pk)
        return CommentSelector.comment_list()

    @comment_create_schema
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = CommentService.comment_create(
            data=serializer.validated_data,
            user=request.user,
        )
        return Response(
            CommentSerializer(comment, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_update(self, serializer):
        serializer.instance = CommentService.comment_update(serializer.instance, serializer.validated_data)

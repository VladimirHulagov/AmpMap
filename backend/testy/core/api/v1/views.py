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
from pathlib import Path

import permissions
from django.shortcuts import get_object_or_404
from filters import AttachmentFilter, LabelFilter, ProjectFilter, ProjectOrderingFilter, TestyFilterBackend
from paginations import StandardSetPagination
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from swagger.projects import (
    project_create_schema,
    project_list_schema,
    project_parameters_schema,
    project_plans_schema,
    project_progress_schema,
    project_update_schema,
)

from testy.core.api.v1.serializers import (
    AllProjectsStatisticSerializer,
    AttachmentSerializer,
    LabelSerializer,
    ProjectRetrieveSerializer,
    ProjectSerializer,
    ProjectStatisticsSerializer,
    SystemMessageSerializer,
)
from testy.core.mixins import MediaViewMixin
from testy.core.models import Project, SystemMessage
from testy.core.selectors.attachments import AttachmentSelector
from testy.core.selectors.labels import LabelSelector
from testy.core.selectors.projects import ProjectSelector
from testy.core.services.attachments import AttachmentService
from testy.core.services.labels import LabelService
from testy.core.services.projects import ProjectService
from testy.root.mixins import TestyArchiveMixin, TestyModelViewSet
from testy.tests_representation.api.v1.serializers import (
    ParameterSerializer,
    TestPlanProgressSerializer,
    TestPlanTreeSerializer,
)
from testy.tests_representation.selectors.parameters import ParameterSelector
from testy.tests_representation.selectors.testplan import TestPlanSelector
from testy.utilities.request import PeriodDateTime

_GET = 'get'


class ProjectViewSet(TestyModelViewSet, TestyArchiveMixin, MediaViewMixin):
    queryset = ProjectSelector.project_list()
    serializer_class = ProjectSerializer
    filter_backends = [TestyFilterBackend, ProjectOrderingFilter]
    filterset_class = ProjectFilter
    permission_classes = [permissions.IsAdminOrForbidArchiveUpdate, IsAuthenticated]
    ordering_fields = ['name', 'is_archive']
    pagination_class = StandardSetPagination
    schema_tags = ['Projects']

    def get_queryset(self):
        if self.action in {'recovery_list', 'restore', 'delete_permanently'}:
            return ProjectSelector().project_deleted_list()
        return ProjectSelector.project_list()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectRetrieveSerializer
        return ProjectSerializer

    @project_plans_schema
    @action(methods=[_GET], url_path='testplans', url_name='testplans', detail=True)
    def testplans_by_project(self, request, pk):
        qs = TestPlanSelector().testplan_project_root_list(project_id=pk)
        serializer = TestPlanTreeSerializer(qs, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    @project_parameters_schema
    @action(methods=[_GET], url_path='parameters', url_name='parameters', detail=True)
    def parameters_by_project(self, request, pk):
        qs = ParameterSelector().parameter_project_list(project_id=pk)
        serializer = ParameterSerializer(qs, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    @action(methods=[_GET], url_path='icon', url_name='icon', detail=True)
    def icon(self, request, pk, *args, **kwargs):
        project = get_object_or_404(Project, pk=pk)
        if not project.icon or not project.icon.storage.exists(project.icon.path):
            return Response(status=status.HTTP_404_NOT_FOUND)
        return self.retrieve_filepath(project.icon, request, generate_thumbnail=False)

    @project_progress_schema
    @action(methods=[_GET], url_path='progress', url_name='progress', detail=True)
    def project_progress(self, request, pk):
        period = PeriodDateTime(request, 'start_date', 'end_date')
        plans = ProjectSelector().project_progress(
            pk, period=period,
        )
        return Response(TestPlanProgressSerializer(plans, many=True).data)

    @project_list_schema
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(ProjectSelector.project_list_statistics())

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = ProjectStatisticsSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = ProjectStatisticsSerializer(queryset, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    @project_create_schema
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = ProjectService().project_create(serializer.validated_data)
        return Response(
            ProjectRetrieveSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @project_update_schema
    def update(self, request, *args, **kwargs):
        partial = kwargs.get('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        new_instance = ProjectService().project_update(instance, serializer.validated_data)
        return Response(ProjectRetrieveSerializer(new_instance, context=self.get_serializer_context()).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, pk, *args, **kwargs):
        instance = self.get_object()
        if instance.icon:
            ProjectService().remove_media(Path(instance.icon.path))
        return super().destroy(request, pk, *args, **kwargs)


class AttachmentViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    queryset = AttachmentSelector().attachment_list()
    serializer_class = AttachmentSerializer
    filter_backends = [TestyFilterBackend]
    filterset_class = AttachmentFilter

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attachments = AttachmentService().attachment_create(serializer.validated_data, request)
        data = [
            self.get_serializer(
                attachment,
                context=self.get_serializer_context(),
            ).data for attachment in attachments
        ]
        return Response(data, status=status.HTTP_201_CREATED)


class LabelViewSet(TestyModelViewSet):
    queryset = LabelSelector().label_list()
    serializer_class = LabelSerializer
    filter_backends = [TestyFilterBackend]
    filterset_class = LabelFilter
    schema_tags = ['Labels']

    def perform_create(self, serializer: ProjectSerializer):
        serializer.instance = LabelService().label_create(serializer.validated_data)

    def perform_update(self, serializer: ProjectSerializer):
        serializer.instance = LabelService().label_update(serializer.instance, serializer.validated_data)


class SystemMessagesViewSet(mixins.ListModelMixin, GenericViewSet):
    serializer_class = SystemMessageSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return SystemMessage.objects.filter(is_active=True).order_by('-updated_at')


class SystemStatisticViewSet(mixins.ListModelMixin, GenericViewSet):
    queryset = Project.objects.none()
    serializer_class = AllProjectsStatisticSerializer
    schema_tags = ['statistics']

    def list(self, request, *args, **kwargs):
        statistic = ProjectSelector.all_projects_statistic()
        serializer = AllProjectsStatisticSerializer(statistic)
        return Response(serializer.data)

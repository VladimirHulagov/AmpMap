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
import permissions
from core.api.v1.serializers import (
    AttachmentSerializer,
    LabelSerializer,
    ProjectSerializer,
    ProjectStatisticsSerializer,
    SystemMessageSerializer,
)
from core.models import SystemMessage
from core.selectors.attachments import AttachmentSelector
from core.selectors.labels import LabelSelector
from core.selectors.projects import ProjectSelector
from core.services.attachments import AttachmentService
from core.services.projects import ProjectService
from filters import AttachmentFilter, LabelFilter, ProjectArchiveFilter, TestyFilterBackend
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from tests_representation.api.v1.serializers import (
    ParameterSerializer,
    TestPlanProgressSerializer,
    TestPlanTreeSerializer,
)
from tests_representation.selectors.parameters import ParameterSelector
from tests_representation.selectors.testplan import TestPlanSelector
from utilities.request import PeriodDateTime

from testy.mixins import TestyArchiveMixin, TestyModelViewSet


class ProjectViewSet(TestyModelViewSet, TestyArchiveMixin):
    queryset = ProjectSelector.project_list()
    serializer_class = ProjectSerializer
    filter_backends = [TestyFilterBackend]
    filterset_class = ProjectArchiveFilter
    permission_classes = [permissions.IsAdminOrForbidArchiveUpdate, IsAuthenticated]

    def get_queryset(self):
        if self.action in ['recovery_list', 'restore', 'delete_permanently']:
            return ProjectSelector().project_deleted_list()
        return ProjectSelector.project_list()

    @action(detail=False)
    def testplans_by_project(self, request, pk):
        qs = TestPlanSelector().testplan_project_root_list(project_id=pk)
        serializer = TestPlanTreeSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False)
    def parameters_by_project(self, request, pk):
        qs = ParameterSelector().parameter_project_list(project_id=pk)
        serializer = ParameterSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True)
    def project_progress(self, request, pk):
        period = PeriodDateTime(request, 'start_date', 'end_date')
        plans = ProjectSelector().project_progress(
            pk, period=period
        )
        return Response(TestPlanProgressSerializer(plans, many=True).data)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(ProjectSelector.project_list_statistics())
        serializer = ProjectStatisticsSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def perform_create(self, serializer: ProjectSerializer):
        serializer.instance = ProjectService().project_create(serializer.validated_data)

    def perform_update(self, serializer: ProjectSerializer):
        serializer.instance = ProjectService().project_update(serializer.instance, serializer.validated_data)


class AttachmentViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, mixins.CreateModelMixin,
                        mixins.DestroyModelMixin, GenericViewSet):
    queryset = AttachmentSelector().attachment_list()
    serializer_class = AttachmentSerializer
    filter_backends = [TestyFilterBackend]
    filterset_class = AttachmentFilter

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attachments = AttachmentService().attachment_create(serializer.validated_data, request)
        data = [self.get_serializer(attachment, context={'request': request}).data for attachment in attachments]
        return Response(data, status=status.HTTP_201_CREATED)


class LabelViewSet(TestyModelViewSet):
    queryset = LabelSelector().label_list()
    serializer_class = LabelSerializer
    filter_backends = [TestyFilterBackend]
    filterset_class = LabelFilter


class SystemMessagesViewSet(mixins.ListModelMixin, GenericViewSet):
    serializer_class = SystemMessageSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return SystemMessage.objects.filter(is_active=True).order_by('-updated_at')

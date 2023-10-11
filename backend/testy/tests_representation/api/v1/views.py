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

from core.api.v1.serializers import LabelSerializer
from core.selectors.labels import LabelSelector
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from drf_yasg.utils import swagger_auto_schema
from filters import (
    ActivityFilter,
    ActivityOrderingFilter,
    ActivitySearchFilter,
    ParameterFilter,
    TestFilter,
    TestOrderingFilter,
    TestPlanFilter,
    TestPlanSearchFilter,
    TestResultFilter,
    TestyBaseSearchFilter,
    TestyFilterBackend,
)
from mptt.exceptions import InvalidMove
from paginations import StandardSetPagination
from permissions import ForbidChangesOnArchivedProject, IsAdminOrForbidArchiveUpdate
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet, ModelViewSet, ViewSet
from tests_description.api.v1.serializers import TestSuiteTreeBreadcrumbsSerializer
from tests_description.selectors.cases import TestCaseSelector
from tests_description.selectors.suites import TestSuiteSelector
from tests_representation.api.v1.serializers import (
    ParameterSerializer,
    TestPlanInputSerializer,
    TestPlanOutputSerializer,
    TestPlanProgressSerializer,
    TestPlanStatisticsSerializer,
    TestPlanTreeSerializer,
    TestPlanUpdateSerializer,
    TestResultActivitySerializer,
    TestResultInputSerializer,
    TestResultSerializer,
    TestSerializer,
)
from tests_representation.choices import TestStatuses
from tests_representation.models import TestPlan
from tests_representation.selectors.parameters import ParameterSelector
from tests_representation.selectors.results import TestResultSelector
from tests_representation.selectors.testplan import TestPlanSelector
from tests_representation.selectors.tests import TestSelector
from tests_representation.services.parameters import ParameterService
from tests_representation.services.results import TestResultService
from tests_representation.services.testplans import TestPlanService
from tests_representation.services.tests import TestService
from tests_representation.utils import HistogramProcessor
from utilities.request import PeriodDateTime, get_boolean

from testy.mixins import TestyArchiveMixin, TestyModelViewSet
from utils import get_breadcrumbs_treeview


class ParameterViewSet(TestyModelViewSet):
    queryset = ParameterSelector().parameter_list()
    serializer_class = ParameterSerializer
    filter_backends = [TestyFilterBackend]
    filterset_class = ParameterFilter

    def perform_create(self, serializer: ParameterSerializer):
        serializer.instance = ParameterService().parameter_create(serializer.validated_data)

    def perform_update(self, serializer: ParameterSerializer):
        serializer.instance = ParameterService().parameter_update(serializer.instance, serializer.validated_data)


class TestPLanStatisticsView(ViewSet):
    def get_view_name(self):
        return "Test Plan Statistics"

    def get_object(self, pk):
        try:
            return TestPlanSelector().testplan_get_by_pk(pk)
        except ObjectDoesNotExist:
            raise Http404

    @swagger_auto_schema(responses={200: TestPlanStatisticsSerializer(many=True)})
    def get(self, request, pk):
        filter = {}

        labels = request.GET.get('labels')
        if labels:
            filter['labels'] = tuple(labels.split(','))

        labels_condition = request.GET.get('labels_condition')
        if labels_condition == 'and':
            filter['labels_condition'] = labels_condition

        test_plan = self.get_object(pk)

        return Response(TestPlanSelector().testplan_statistics(test_plan, filter))

    @action(detail=True)
    def get_histogram(self, request, pk):
        test_plan = self.get_object(pk)
        processor = HistogramProcessor(request_data=request.GET)
        return Response(TestPlanSelector().testplan_histogram(test_plan, processor))


class TestPlanViewSet(TestyModelViewSet, TestyArchiveMixin):
    serializer_class = TestPlanOutputSerializer
    queryset = None
    filter_backends = [TestyFilterBackend, TestPlanSearchFilter, OrderingFilter]
    filterset_class = TestPlanFilter
    permission_classes = [IsAdminOrForbidArchiveUpdate, IsAuthenticated]
    pagination_class = StandardSetPagination
    ordering_fields = ['started_at', 'created_at', 'name']
    search_fields = ['title']

    def get_queryset(self):
        if self.action in ['recovery_list', 'restore', 'delete_permanently']:
            return TestPlanSelector().testplan_deleted_list()
        if get_boolean(self.request, 'treeview') and self.action == 'list':
            return TestPlanSelector().testplan_treeview_list(
                is_archive=get_boolean(self.request, 'is_archive'),
                children_ordering=self.request.query_params.get('ordering'),
                parent_id=self.request.query_params.get('parent')
            )
        if self.action == 'breadcrumbs_view':
            return TestPlanSelector.testplan_list_raw()
        return TestPlanSelector().testplan_list(get_boolean(self.request, 'is_archive'))

    @action(detail=True)
    def breadcrumbs_view(self, request, *args, **kwargs):
        instance = self.get_object()
        tree = TestPlanSelector.testplan_list_ancestors(instance)
        return Response(
            get_breadcrumbs_treeview(
                instances=tree,
                depth=len(tree) - 1,
                title_method=TestPlanOutputSerializer.get_title
            )
        )

    @action(detail=True)
    def activity(self, request, pk, *args, **kwargs):
        instance = TestPlan.objects.get(pk=pk)
        history_records = TestResultSelector.result_cascade_history_list_by_test_plan(instance)
        history_records = ActivityFilter(queryset=history_records, request=request).filter_queryset(request,
                                                                                                    history_records)
        for filter_class in [ActivitySearchFilter, ActivityOrderingFilter]:
            history_records = filter_class().filter_queryset(request, history_records)
        paginator = StandardSetPagination()
        result_page = paginator.paginate_queryset(history_records, request)
        serializer = TestResultActivitySerializer(result_page, many=True, context={'request': request})
        final_data = {}
        plan_ids = set([result['plan_id'] for result in serializer.data])
        ids_to_breadcrumbs = TestPlanSelector().testplan_breadcrumbs_by_ids(plan_ids)
        for result_dict in serializer.data:
            result_dict['breadcrumbs'] = ids_to_breadcrumbs[result_dict.pop('plan_id')]
            action_day = result_dict.pop('action_day')
            if results_list := final_data.get(action_day):
                results_list.append(result_dict)
                continue
            final_data[action_day] = [result_dict]
        return paginator.get_paginated_response(final_data)

    @action(detail=True)
    def labels_view(self, request, *args, **kwargs):
        instance = self.get_object()
        labels = LabelSelector().label_list_by_testplan(instance.id)
        return Response(LabelSerializer(labels, many=True, context={'request': request}).data)

    @action(detail=True)
    def suites_by_plan(self, request, pk):
        suites = TestSuiteSelector().suites_by_plan(pk)
        return Response(TestSuiteTreeBreadcrumbsSerializer(suites, many=True, context={'request': self.request}).data)

    @action(detail=True)
    def cases_by_plan(self, request, pk):
        case_ids = TestCaseSelector().case_ids_by_testplan_id(
            pk,
            include_children=get_boolean(request, 'include_children', default=True)
        )
        return Response(data={'case_ids': case_ids})

    @action(detail=True)
    def plan_progress(self, request, pk):
        period = PeriodDateTime(request, 'start_date', 'end_date')
        plans = TestPlanSelector().get_plan_progress(pk, period=period)
        return Response(TestPlanProgressSerializer(plans, many=True).data)

    def get_serializer_class(self):
        if get_boolean(self.request, 'treeview'):
            return TestPlanTreeSerializer
        return super().get_serializer_class()

    def create(self, request, *args, **kwargs):
        serializer = TestPlanInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plans = []
        if serializer.validated_data.get('parameters'):
            test_plans = TestPlanService().testplan_bulk_create(serializer.validated_data)
        else:
            test_plans.append(TestPlanService().testplan_create(serializer.validated_data))
        return Response(
            TestPlanOutputSerializer(test_plans, many=True, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        test_plan = self.get_object()
        self.check_object_permissions(request, test_plan)
        serializer = TestPlanUpdateSerializer(data=request.data, instance=test_plan, context={"request": request},
                                              partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            test_plan = TestPlanService().testplan_update(test_plan=test_plan, data=serializer.validated_data)
        except InvalidMove as err:
            return Response({'errors': [str(err)]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TestPlanOutputSerializer(test_plan, context={'request': request}).data,
                        status=status.HTTP_200_OK)


class TestListViewSet(mixins.ListModelMixin, GenericViewSet):
    queryset = TestSelector().test_list_with_last_status()
    serializer_class = TestSerializer
    filter_backends = [TestyFilterBackend, TestOrderingFilter, TestyBaseSearchFilter]
    filterset_class = TestFilter
    pagination_class = StandardSetPagination
    ordering_fields = ['id', 'case_name', 'is_archive', 'last_status', 'assignee']
    search_fields = ['case__name']

    def get_view_name(self):
        return "Test List"


class TestDetailViewSet(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, TestyArchiveMixin, GenericViewSet):
    queryset = TestSelector().test_list_with_last_status()
    permission_classes = [IsAdminOrForbidArchiveUpdate, IsAuthenticated]
    serializer_class = TestSerializer

    def perform_update(self, serializer: TestSerializer):
        serializer.instance = TestService().test_update(serializer.instance, serializer.validated_data)

    def get_view_name(self):
        return "Test Instance"

    def get_queryset(self):
        if self.action in ['archive_preview', 'archive_objects', 'restore_archived']:
            return TestSelector().test_list()
        return TestSelector().test_list_with_last_status()


class TestResultViewSet(ModelViewSet, TestyArchiveMixin):
    queryset = TestResultSelector().result_list()
    permission_classes = [ForbidChangesOnArchivedProject, IsAuthenticated]
    serializer_class = TestResultSerializer
    filter_backends = [TestyFilterBackend]
    filterset_class = TestResultFilter

    def perform_update(self, serializer: TestResultSerializer):
        serializer.instance = TestResultService().result_update(serializer.instance, serializer.validated_data)

    def perform_create(self, serializer: TestResultSerializer):
        request = serializer.context.get('request')
        serializer.instance = TestResultService().result_create(serializer.validated_data, request.user)

    def get_serializer_class(self):
        if self.action in ['create', 'partial_update']:
            return TestResultInputSerializer
        return TestResultSerializer


class TestResultChoicesView(APIView):

    def get(self, request):
        choices = [{'id': status_id, 'status': status_name} for status_id, status_name in TestStatuses.choices]
        return Response(choices, status=status.HTTP_200_OK)

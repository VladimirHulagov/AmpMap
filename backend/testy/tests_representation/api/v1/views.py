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
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from mptt.exceptions import InvalidMove
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ViewSet

from testy.core.api.v1.serializers import LabelSerializer
from testy.core.selectors.labels import LabelSelector
from testy.core.services.copy import CopyService
from testy.filters import (
    ActivitySearchFilter,
    CustomOrderingFilter,
    CustomSearchFilter,
    ParameterFilter,
    TestFilter,
    TestOrderingFilter,
    TestPlanFilter,
    TestPlanSearchFilter,
    TestResultFilter,
    TestyBaseSearchFilter,
    TestyFilterBackend,
)
from testy.paginations import StandardSetPagination
from testy.permissions import ForbidChangesOnArchivedProject, IsAdminOrForbidArchiveUpdate
from testy.root.mixins import TestyArchiveMixin, TestyModelViewSet
from testy.swagger.results import result_list_schema
from testy.swagger.testplans import (
    plan_activity_schema,
    plan_case_ids_schema,
    plan_create_schema,
    plan_labels_schema,
    plan_list_schema,
    plan_progress_schema,
    plan_update_schema,
)
from testy.swagger.tests import test_list_schema
from testy.tests_description.api.v1.serializers import TestSuiteTreeBreadcrumbsSerializer
from testy.tests_description.selectors.cases import TestCaseSelector
from testy.tests_description.selectors.suites import TestSuiteSelector
from testy.tests_representation.api.v1.serializers import (
    ParameterSerializer,
    TestPlanCopySerializer,
    TestPlanInputSerializer,
    TestPlanMinSerializer,
    TestPlanOutputSerializer,
    TestPlanProgressSerializer,
    TestPlanRetrieveSerializer,
    TestPlanStatisticsSerializer,
    TestPlanTreeSerializer,
    TestPlanUpdateSerializer,
    TestResultActivitySerializer,
    TestResultInputSerializer,
    TestResultSerializer,
    TestSerializer,
)
from testy.tests_representation.models import TestPlan
from testy.tests_representation.permissions import TestPlanPermission, TestResultPermission
from testy.tests_representation.selectors.parameters import ParameterSelector
from testy.tests_representation.selectors.results import TestResultSelector
from testy.tests_representation.selectors.testplan import TestPlanSelector
from testy.tests_representation.selectors.tests import TestSelector
from testy.tests_representation.services.parameters import ParameterService
from testy.tests_representation.services.results import TestResultService
from testy.tests_representation.services.statistics import HistogramProcessor
from testy.tests_representation.services.testplans import TestPlanService
from testy.tests_representation.services.tests import TestService
from testy.utilities.request import PeriodDateTime, get_boolean

_LABELS = 'labels'
_GET = 'get'
_REQUEST = 'request'
_LABELS_CONDITION = 'labels_condition'
_IS_ARCHIVE = 'is_archive'


class ParameterViewSet(TestyModelViewSet):
    queryset = ParameterSelector().parameter_list()
    serializer_class = ParameterSerializer
    filter_backends = [TestyFilterBackend]
    filterset_class = ParameterFilter
    schema_tags = ['Parameters']

    def perform_create(self, serializer: ParameterSerializer):
        serializer.instance = ParameterService().parameter_create(serializer.validated_data)

    def perform_update(self, serializer: ParameterSerializer):
        serializer.instance = ParameterService().parameter_update(serializer.instance, serializer.validated_data)


class TestPLanStatisticsView(ViewSet):
    schema_tags = ['Test plans']

    def get_view_name(self):
        return 'Test Plan Statistics'

    def get_filter_condition(self, request):
        filter_condition = {}

        for key in (_LABELS, 'not_labels'):
            labels = request.query_params.get(key)
            filter_condition[key] = tuple(labels.split(',')) if labels else None

        labels_condition = request.query_params.get(_LABELS_CONDITION)
        if labels_condition == 'and':
            filter_condition[_LABELS_CONDITION] = labels_condition
        return filter_condition

    def get_object(self, pk):
        return get_object_or_404(TestPlan, pk=pk)

    @swagger_auto_schema(responses={200: TestPlanStatisticsSerializer(many=True)})
    def get(self, request, pk):
        filter_condition = self.get_filter_condition(request)
        test_plan = self.get_object(pk)
        estimate_period = request.query_params.get('estimate_period')
        is_archive = get_boolean(request, _IS_ARCHIVE)

        return Response(
            TestPlanSelector().testplan_statistics(
                test_plan,
                filter_condition,
                estimate_period,
                is_archive,
            ),
        )

    @action(detail=True)
    def get_histogram(self, request, pk):
        test_plan = self.get_object(pk)
        filter_condition = self.get_filter_condition(request)
        processor = HistogramProcessor(request_data=request.query_params)
        is_archive = get_boolean(request, _IS_ARCHIVE)

        return Response(TestPlanSelector().testplan_histogram(test_plan, processor, filter_condition, is_archive))


@plan_list_schema
class TestPlanViewSet(TestyModelViewSet, TestyArchiveMixin):
    serializer_class = TestPlanOutputSerializer
    queryset = TestPlan.objects.none()
    filter_backends = [TestyFilterBackend, TestPlanSearchFilter, OrderingFilter]
    filterset_class = TestPlanFilter
    permission_classes = [IsAuthenticated, IsAdminOrForbidArchiveUpdate, TestPlanPermission]
    pagination_class = StandardSetPagination
    ordering_fields = ['started_at', 'created_at', 'name']
    search_fields = ['title']
    schema_tags = ['Test plans']

    def get_queryset(self):
        if self.action in {'recovery_list', 'restore', 'delete_permanently'}:
            return TestPlanSelector().testplan_deleted_list()
        if get_boolean(self.request, 'treeview') and self.action == 'list':
            return TestPlanSelector().testplan_treeview_list(
                is_archive=get_boolean(self.request, _IS_ARCHIVE),
                children_ordering=self.request.query_params.get('ordering'),
                parent_id=self.request.query_params.get('parent'),
            )
        if self.action == 'breadcrumbs_view':
            return TestPlanSelector.testplan_list_raw()
        return TestPlanSelector().testplan_list(get_boolean(self.request, _IS_ARCHIVE))

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TestPlanRetrieveSerializer
        if self.action == 'copy_plans':
            return TestPlanCopySerializer
        if get_boolean(self.request, 'treeview'):
            return TestPlanTreeSerializer
        return TestPlanOutputSerializer

    @plan_activity_schema
    @action(methods=[_GET], url_path='activity', url_name='activity', detail=True)
    def activity(self, request, pk, *args, **kwargs):
        instance = TestPlan.objects.get(pk=pk)
        history_records = TestResultSelector.result_cascade_history_list_by_test_plan(instance)
        history_records = CustomSearchFilter().filter_queryset(
            request,
            history_records,
            ['history_user', 'status', 'history_type', 'test'],
        )

        for filter_class in (ActivitySearchFilter, CustomOrderingFilter):
            history_records = filter_class().filter_queryset(request, history_records)
        paginator = StandardSetPagination()
        result_page = paginator.paginate_queryset(history_records, request)
        serializer = TestResultActivitySerializer(result_page, many=True, context={_REQUEST: request})
        final_data = {}
        plan_ids = {test_result['plan_id'] for test_result in serializer.data}
        ids_to_breadcrumbs = TestPlanSelector().testplan_breadcrumbs_by_ids(plan_ids)
        for result_dict in serializer.data:
            result_dict['breadcrumbs'] = ids_to_breadcrumbs[result_dict.pop('plan_id')]
            action_day = result_dict.pop('action_day')
            if results_list := final_data.get(action_day):
                results_list.append(result_dict)
                continue
            final_data[action_day] = [result_dict]
        return paginator.get_paginated_response(final_data)

    @plan_labels_schema
    @action(methods=[_GET], url_path=_LABELS, url_name=_LABELS, detail=True)
    def labels_view(self, request, *args, **kwargs):
        instance = self.get_object()
        labels = LabelSelector().label_list_by_testplan(instance.id)
        return Response(LabelSerializer(labels, many=True, context={_REQUEST: request}).data)

    @action(methods=[_GET], url_path='suites', url_name='suites', detail=True)
    def suites_by_plan(self, request, pk):
        suites = TestSuiteSelector().suites_by_plan(pk)
        return Response(TestSuiteTreeBreadcrumbsSerializer(suites, many=True, context={_REQUEST: self.request}).data)

    @plan_case_ids_schema
    @action(methods=[_GET], url_path='cases', url_name='cases', detail=True)
    def cases_by_plan(self, request, pk):
        case_ids = TestCaseSelector().case_ids_by_testplan_id(
            pk,
            include_children=get_boolean(request, 'include_children', default=True),
        )
        return Response(data={'case_ids': case_ids})

    @plan_progress_schema
    @action(methods=[_GET], url_path='progress', url_name='progress', detail=True)
    def plan_progress(self, request, pk):
        period = PeriodDateTime(request, 'start_date', 'end_date')
        plans = TestPlanSelector().get_plan_progress(pk, period=period)
        return Response(TestPlanProgressSerializer(plans, many=True).data)

    @plan_create_schema
    def create(self, request, *args, **kwargs):
        serializer = TestPlanInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plans = []
        if serializer.validated_data.get('parameters'):
            test_plans = TestPlanService().testplan_bulk_create(serializer.validated_data)
        else:
            test_plans.append(TestPlanService().testplan_create(serializer.validated_data))
        return Response(
            TestPlanMinSerializer(test_plans, many=True, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    @plan_update_schema
    def update(self, request, *args, **kwargs):
        test_plan = self.get_object()
        self.check_object_permissions(request, test_plan)
        serializer = TestPlanUpdateSerializer(
            data=request.data,
            instance=test_plan,
            context=self.get_serializer_context(),
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        try:
            test_plan = TestPlanService().testplan_update(test_plan=test_plan, data=serializer.validated_data)
        except InvalidMove as err:
            return Response({'errors': [str(err)]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            TestPlanOutputSerializer(test_plan, context=self.get_serializer_context()).data,
            status=status.HTTP_200_OK,
        )

    @action(methods=['post'], url_path='copy', url_name='copy', detail=False)
    def copy_plans(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plans = CopyService.plans_copy(serializer.validated_data)
        return Response(
            TestPlanOutputSerializer(
                plans,
                many=True,
                context=self.get_serializer_context(),
            ).data,
        )


@test_list_schema
class TestViewSet(TestyModelViewSet, TestyArchiveMixin):
    queryset = TestSelector().test_list_with_last_status()
    serializer_class = TestSerializer
    filter_backends = [TestyFilterBackend, TestOrderingFilter, TestyBaseSearchFilter]
    filterset_class = TestFilter
    pagination_class = StandardSetPagination
    permission_classes = [IsAdminOrForbidArchiveUpdate, IsAuthenticated]
    ordering_fields = ['id', 'case_name', _IS_ARCHIVE, 'last_status', 'assignee']
    search_fields = ['case__name']
    http_method_names = [_GET, 'post', 'put', 'patch', 'head', 'options', 'trace']
    schema_tags = ['Tests']

    def perform_update(self, serializer: TestSerializer):
        serializer.instance = TestService().test_update(serializer.instance, serializer.validated_data)

    def get_queryset(self):
        if self.action in {'archive_preview', 'archive_objects', 'restore_archived'}:
            return TestSelector().test_list()
        return TestSelector().test_list_with_last_status()


@result_list_schema
class TestResultViewSet(ModelViewSet, TestyArchiveMixin):
    queryset = TestResultSelector().result_list()
    permission_classes = [IsAuthenticated, ForbidChangesOnArchivedProject, TestResultPermission]
    serializer_class = TestResultSerializer
    filter_backends = [TestyFilterBackend]
    filterset_class = TestResultFilter
    schema_tags = ['Test results']

    def perform_update(self, serializer: TestResultSerializer):
        serializer.instance = TestResultService().result_update(serializer.instance, serializer.validated_data)

    def perform_create(self, serializer: TestResultSerializer):
        request = serializer.context.get(_REQUEST)
        serializer.instance = TestResultService().result_create(serializer.validated_data, request.user)

    def get_serializer_class(self):
        if self.action in {'create', 'partial_update'}:
            return TestResultInputSerializer
        return TestResultSerializer

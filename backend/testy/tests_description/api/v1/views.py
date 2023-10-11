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
from core.services.copy import CopyService
from django.http import Http404
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from filters import TestCaseFilter, TestSuiteFilter, TestSuiteSearchFilter, TestyBaseSearchFilter, TestyFilterBackend
from mptt.exceptions import InvalidMove
from paginations import StandardSetPagination
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from tests_description.api.v1.serializers import (
    TestCaseCopySerializer,
    TestCaseInputSerializer,
    TestCaseInputWithStepsSerializer,
    TestCaseRetrieveSerializer,
    TestCaseSerializer,
    TestSuiteBaseSerializer,
    TestSuiteCopySerializer,
    TestSuiteSerializer,
    TestSuiteTreeCasesSerializer,
    TestSuiteTreeSerializer,
)
from tests_description.selectors.cases import TestCaseSelector
from tests_description.selectors.suites import TestSuiteSelector
from tests_description.services.cases import TestCaseService
from tests_description.services.suites import TestSuiteService
from utilities.request import get_boolean

from testy.mixins import TestyModelViewSet
from utils import get_breadcrumbs_treeview


class TestCaseViewSet(TestyModelViewSet):
    queryset = TestCaseSelector().case_list()
    serializer_class = TestCaseSerializer
    filter_backends = [TestyFilterBackend, TestyBaseSearchFilter, OrderingFilter]
    filterset_class = TestCaseFilter
    pagination_class = StandardSetPagination
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options', 'trace']
    search_fields = ['name']
    ordering_fields = ['id']

    def get_queryset(self):
        if self.action in ['recovery_list', 'restore', 'delete_permanently']:
            return TestCaseSelector().case_deleted_list()
        return TestCaseSelector().case_list()

    def get_serializer_class(self):
        if self.action in ['create', 'update']:
            if get_boolean(self.request, 'is_steps', method='data'):
                return TestCaseInputWithStepsSerializer
            return TestCaseInputSerializer
        return super().get_serializer_class()

    @swagger_auto_schema(
        request_body=TestCaseInputWithStepsSerializer,
        responses={201: TestCaseRetrieveSerializer}
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get('is_steps', False):
            test_case = TestCaseService().case_with_steps_create({'user': request.user, **serializer.validated_data})
        else:
            test_case = TestCaseService().case_create({'user': request.user, **serializer.validated_data})
        serializer_output = TestCaseRetrieveSerializer(test_case, context={'request': request})
        headers = self.get_success_headers(serializer_output.data)
        return Response(serializer_output.data, status=status.HTTP_201_CREATED, headers=headers)

    @swagger_auto_schema(
        request_body=TestCaseInputWithStepsSerializer,
        responses={201: TestCaseRetrieveSerializer}
    )
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get('is_steps', False):
            instance = TestCaseService().case_with_steps_update(serializer.instance, {
                'user': request.user, **serializer.validated_data})
        else:
            instance = TestCaseService().case_update(serializer.instance, {
                'user': request.user, **serializer.validated_data})

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(TestCaseRetrieveSerializer(instance, context={'request': request}).data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        version = self.request.GET.get('version', None)
        if version is not None:
            try:
                version = int(version)
            except ValueError:
                raise Http404
            history_instance = get_object_or_404(instance.history, history_id=version)
            instance = history_instance.instance
        serializer = TestCaseRetrieveSerializer(instance, version=version, context={'request': request})
        return Response(serializer.data)

    @action(detail=False)
    def copy_cases(self, request):
        serializer = TestCaseCopySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cases = TestCaseService.cases_copy(serializer.validated_data)
        return Response(self.get_serializer(cases, many=True).data)


class TestSuiteViewSet(TestyModelViewSet):
    serializer_class = TestSuiteSerializer
    filter_backends = [TestyFilterBackend, TestSuiteSearchFilter, OrderingFilter]
    filterset_class = TestSuiteFilter
    pagination_class = StandardSetPagination
    search_fields = ['name']

    def perform_create(self, serializer: TestSuiteSerializer):
        serializer.instance = TestSuiteService().suite_create(serializer.validated_data)

    def perform_update(self, serializer: TestSuiteSerializer):
        serializer.instance = TestSuiteService().suite_update(serializer.instance, serializer.validated_data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_update(serializer)
        except InvalidMove as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def get_serializer_class(self):
        if get_boolean(self.request, 'show_cases') and get_boolean(self.request, 'treeview'):
            return TestSuiteTreeCasesSerializer
        if get_boolean(self.request, 'treeview'):
            return TestSuiteTreeSerializer
        if get_boolean(self.request, 'is_flat'):
            return TestSuiteBaseSerializer
        return TestSuiteSerializer

    @action(detail=True)
    def breadcrumbs_view(self, request, *args, **kwargs):
        instance = self.get_object()
        tree = TestSuiteSelector.suite_list_ancestors(instance)
        return Response(get_breadcrumbs_treeview(instances=tree, depth=len(tree) - 1))

    def get_queryset(self):
        if self.action in ['recovery_list', 'restore', 'delete_permanently']:
            return TestSuiteSelector().suite_deleted_list()
        if get_boolean(self.request, 'show_cases') and get_boolean(self.request, 'treeview') and self.action == 'list':
            return TestSuiteSelector().suite_list_treeview_with_cases()
        if get_boolean(self.request, 'treeview') and self.action == 'list':
            parent = self.request.query_params.get('parent')
            root_only = parent is None or parent == ''  # if parent is provided turn off root_only
            return TestSuiteSelector().suite_list_treeview(root_only=root_only)
        if get_boolean(self.request, 'treeview') and self.action == 'retrieve':
            return TestSuiteSelector().suite_list_treeview(root_only=False)
        if self.action == 'breadcrumbs_view':
            return TestSuiteSelector.suite_list_raw()
        return TestSuiteSelector().suite_list()

    @action(detail=False)
    def copy_suites(self, request):
        serializer = TestSuiteCopySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if suite := serializer.validated_data.get('dst_suite_id'):
            if suite.project != serializer.validated_data.get('dst_project_id'):
                return Response(
                    status=status.HTTP_400_BAD_REQUEST,
                    data={'errors': ["Project and Suite's project must be same"]}
                )
        suites = CopyService.suites_copy(serializer.validated_data)
        return Response(TestSuiteBaseSerializer(suites, many=True, context={'request': request}).data)

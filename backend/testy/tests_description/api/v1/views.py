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
from filters import (
    CustomOrderingFilter,
    CustomSearchFilter,
    TestCaseFilter,
    TestSuiteFilter,
    TestSuiteSearchFilter,
    TestyBaseSearchFilter,
    TestyFilterBackend,
)
from mptt.exceptions import InvalidMove
from paginations import StandardSetPagination
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from swagger.cases import (
    cases_copy_schema,
    cases_create_schema,
    cases_list_schema,
    cases_retrieve_schema,
    cases_search_schema,
    cases_tests_schema,
    cases_update_schema,
    cases_version_restore_schema,
)
from swagger.suites import suite_copy_schema, suite_list_schema, suite_retrieve_schema, suites_breadcrumbs_schema

from testy.core.services.copy import CopyService
from testy.root.mixins import TestyArchiveMixin, TestyModelViewSet
from testy.tests_description.api.v1.serializers import (
    TestCaseCopySerializer,
    TestCaseHistorySerializer,
    TestCaseInputSerializer,
    TestCaseInputWithStepsSerializer,
    TestCaseListSerializer,
    TestCaseRestoreSerializer,
    TestCaseRetrieveSerializer,
    TestSuiteBaseSerializer,
    TestSuiteCopySerializer,
    TestSuiteSerializer,
    TestSuiteTreeCasesSerializer,
    TestSuiteTreeSerializer,
)
from testy.tests_description.models import TestSuite
from testy.tests_description.selectors.cases import TestCaseSelector
from testy.tests_description.selectors.suites import TestSuiteSelector
from testy.tests_description.services.cases import TestCaseService
from testy.tests_description.services.suites import TestSuiteService
from testy.tests_representation.api.v1.serializers import TestSerializer
from testy.tests_representation.selectors.testplan import TestPlanSelector
from testy.tests_representation.selectors.tests import TestSelector
from testy.utilities.request import get_boolean
from testy.utilities.tree import form_tree_prefetch_objects, get_breadcrumbs_treeview

_USER = 'user'
_GET = 'get'
_POST = 'post'
_COPY = 'copy'


@cases_list_schema
class TestCaseViewSet(TestyModelViewSet, TestyArchiveMixin):
    queryset = TestCaseSelector().case_list()
    serializer_class = TestCaseListSerializer
    filter_backends = [TestyFilterBackend, TestyBaseSearchFilter, OrderingFilter]
    filterset_class = TestCaseFilter
    pagination_class = StandardSetPagination
    http_method_names = [_GET, _POST, 'put', 'delete', 'head', 'options', 'trace']
    search_fields = ['name']
    ordering_fields = ['id', 'name']
    schema_tags = ['Test cases']

    def get_queryset(self):
        if self.action in {'recovery_list', 'restore', 'delete_permanently'}:
            return TestCaseSelector().case_deleted_list()
        if self.action == 'restore_archived':
            return TestCaseSelector().case_list({'is_archive': True})
        filter_condition = None
        if self.action == 'list' and not get_boolean(self.request, 'is_archive'):
            filter_condition = {'is_archive': False}
        return TestCaseSelector().case_list(filter_condition)

    def get_serializer_class(self):
        if self.action == 'copy_cases':
            return TestCaseRetrieveSerializer
        if self.action in {'create', 'update'}:
            if get_boolean(self.request, 'is_steps', method='data'):
                return TestCaseInputWithStepsSerializer
            return TestCaseInputSerializer
        return super().get_serializer_class()

    @cases_create_schema
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get('is_steps', False):
            test_case = TestCaseService().case_with_steps_create({_USER: request.user, **serializer.validated_data})
        else:
            test_case = TestCaseService().case_create({_USER: request.user, **serializer.validated_data})
        serializer_output = TestCaseRetrieveSerializer(test_case, context=self.get_serializer_context())
        headers = self.get_success_headers(serializer_output.data)
        return Response(serializer_output.data, status=status.HTTP_201_CREATED, headers=headers)

    @cases_update_schema
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get('is_steps', False):
            instance = TestCaseService().case_with_steps_update(
                serializer.instance, {
                    _USER: request.user, **serializer.validated_data,
                },
            )
        else:
            instance = TestCaseService().case_update(
                serializer.instance, {
                    _USER: request.user, **serializer.validated_data,
                },
            )

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(TestCaseRetrieveSerializer(instance, context=self.get_serializer_context()).data)

    @cases_retrieve_schema
    def retrieve(self, request, pk=None, **kwargs):
        version = request.query_params.get('version')
        instance, version = TestCaseSelector.case_by_version(pk, version)
        serializer = TestCaseRetrieveSerializer(instance, version=version, context=self.get_serializer_context())
        return Response(serializer.data)

    @cases_copy_schema
    @action(methods=[_POST], url_path=_COPY, url_name=_COPY, detail=False)
    def copy_cases(self, request):
        serializer = TestCaseCopySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cases = TestCaseService.cases_copy(serializer.validated_data)
        return Response(self.get_serializer(cases, many=True).data)

    @cases_tests_schema
    @action(methods=[_GET], url_path='tests', url_name='tests', detail=True)
    def get_tests(self, request, pk):
        query = TestSelector().test_list_with_last_status({'case_id': pk})
        filtered_query = CustomSearchFilter().filter_queryset(request, query, ['last_status'])
        ordered_query = CustomOrderingFilter().filter_queryset(request, filtered_query)
        page = self.paginate_queryset(ordered_query)
        serializer = TestSerializer(page, many=True, context=self.get_serializer_context())
        response_tests = []
        plan_ids = {test['plan'] for test in serializer.data}
        ids_to_breadcrumbs = TestPlanSelector().testplan_breadcrumbs_by_ids(plan_ids)
        for test in serializer.data:
            test['breadcrumbs'] = ids_to_breadcrumbs[test.get('plan')]
            response_tests.append(test)
        return self.get_paginated_response(response_tests)

    @action(methods=[_GET], url_path='history', url_name='history', detail=True)
    def get_history(self, request, pk):
        ordering_filter = CustomOrderingFilter()
        pagination = StandardSetPagination()

        queryset = ordering_filter.filter_queryset(
            request,
            TestCaseSelector.get_history_by_case_id(pk),
        )
        page = pagination.paginate_queryset(queryset, request) or queryset
        serializer = TestCaseHistorySerializer(
            page,
            context=self.get_serializer_context(),
            many=True,
        )
        return pagination.get_paginated_response(serializer.data)

    @cases_version_restore_schema
    @action(methods=[_POST], url_path='version/restore', url_name='restore-version', detail=True)
    def restore_case_version(self, request, pk):
        instance = self.get_object()
        serializer = TestCaseRestoreSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_test_case = TestCaseService.restore_version(serializer.validated_data.get('version'), pk)
        return Response(TestCaseRetrieveSerializer(updated_test_case, context=self.get_serializer_context()).data)

    @cases_search_schema
    @action(methods=[_GET], url_path='search', url_name='search', detail=False)
    def cases_search(self, request):
        cases = self.get_queryset()
        cases = self.filter_queryset(cases)
        suites_selector = TestSuiteSelector()
        suites = TestSuiteSelector().suites_by_ids_list(
            cases.values_list('pk', flat=True),
            field_name='test_cases__pk',
        )
        suites_depth = suites_selector.get_max_level()
        suites = (
            suites
            .get_ancestors(include_self=True)
            .filter(parent=None)
            .prefetch_related(
                *suites_selector.suites_tree_prefetch_children(suites_depth),
                *form_tree_prefetch_objects(
                    nested_prefetch_field='child_test_suites',
                    prefetch_field='test_cases',
                    tree_depth=suites_depth,
                    queryset=cases,
                ),
            ).annotate(**suites_selector.cases_count_annotation())
        )
        return Response(
            data=TestSuiteTreeCasesSerializer(
                suites,
                context=self.get_serializer_context(),
                many=True,
            ).data,
        )


@suite_list_schema
@suite_retrieve_schema
class TestSuiteViewSet(TestyModelViewSet):
    queryset = TestSuite.objects.none()
    serializer_class = TestSuiteSerializer
    filter_backends = [TestyFilterBackend, TestSuiteSearchFilter, OrderingFilter]
    filterset_class = TestSuiteFilter
    pagination_class = StandardSetPagination
    search_fields = ['name']
    schema_tags = ['Test suites']

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

        return Response(self.get_serializer(self.get_object()).data)

    def get_serializer_class(self):
        if get_boolean(self.request, 'show_cases') and get_boolean(self.request, 'treeview'):
            return TestSuiteTreeCasesSerializer
        if get_boolean(self.request, 'treeview'):
            return TestSuiteTreeSerializer
        if self.action in {'recovery_list', 'restore', 'delete_permanently'} or get_boolean(self.request, 'is_flat'):
            return TestSuiteBaseSerializer
        return TestSuiteSerializer

    def get_queryset(self):
        treeview = get_boolean(self.request, 'treeview')
        if self.action in {'recovery_list', 'restore', 'delete_permanently'}:
            return TestSuiteSelector().suite_deleted_list()
        if get_boolean(self.request, 'show_cases') and treeview and self.action == 'list':
            return TestSuiteSelector().suite_list_treeview_with_cases()
        if treeview and self.action == 'list':
            parent = self.request.query_params.get('parent')
            root_only = parent is None or parent == ''  # if parent is provided turn off root_only
            return TestSuiteSelector().suite_list_treeview(root_only=root_only)
        if treeview and self.action == 'retrieve':
            return TestSuiteSelector().suite_list_treeview(root_only=False)
        if self.action == 'breadcrumbs_view':
            return TestSuiteSelector.suite_list_raw()
        return TestSuiteSelector().suite_list()

    @suites_breadcrumbs_schema
    @action(methods=[_GET], url_path='parents', url_name='breadcrumbs', detail=True)
    def breadcrumbs_view(self, request, *args, **kwargs):
        instance = self.get_object()
        tree = TestSuiteSelector.suite_list_ancestors(instance)
        return Response(get_breadcrumbs_treeview(instances=tree, depth=len(tree) - 1))

    @suite_copy_schema
    @action(methods=[_POST], url_path=_COPY, url_name=_COPY, detail=False)
    def copy_suites(self, request):
        serializer = TestSuiteCopySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if suite := serializer.validated_data.get('dst_suite_id'):
            if suite.project != serializer.validated_data.get('dst_project_id'):
                return Response(
                    status=status.HTTP_400_BAD_REQUEST,
                    data={'errors': ["Project and Suite's project must be same"]},
                )
        suites = CopyService.suites_copy(serializer.validated_data)
        return Response(TestSuiteBaseSerializer(suites, many=True, context=self.get_serializer_context()).data)

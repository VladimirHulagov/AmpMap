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

from django.urls import path
from rest_framework.routers import SimpleRouter
from tests_representation.api.v1 import views
from tests_representation.api.v1.views import TestPLanStatisticsView, TestResultChoicesView

router = SimpleRouter()
router.register('parameters', views.ParameterViewSet)
router.register('results', views.TestResultViewSet)

test_lists = views.TestListViewSet.as_view({'get': 'list'})
test_detail = views.TestDetailViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
})
testplan_list = views.TestPlanViewSet.as_view({'get': 'list', 'post': 'create'})
testplan_detail = views.TestPlanViewSet.as_view({
    'get': 'retrieve',
    'delete': 'destroy',
    'patch': 'partial_update',
})
testplan_labels_view = views.TestPlanViewSet.as_view({'get': 'labels_view'})
breadcrumbs_plans_view = views.TestPlanViewSet.as_view({'get': 'breadcrumbs_view'})
activity_view = views.TestPlanViewSet.as_view({'get': 'activity'})
urlpatterns = [
    path('tests/', test_lists, name='test-list'),
    path('tests/<int:pk>/', test_detail, name='test-detail'),
    path('tests/<int:pk>/archive/preview/', views.TestDetailViewSet.as_view({'get': 'archive_preview'}),
         name='test-archive-preview'),
    path('tests/<int:pk>/archive/', views.TestDetailViewSet.as_view({'post': 'archive_objects'}),
         name='test-archive-commit'),
    path('tests/archive/restore/', views.TestDetailViewSet.as_view({'post': 'restore_archived'}),
         name='test-archive-restore'),

    path('testplans/', testplan_list, name='testplan-list'),
    path('testplans/<int:pk>/', testplan_detail, name='testplan-detail'),
    path('testplans/<int:pk>/statistics/', TestPLanStatisticsView.as_view({'get': 'get'}), name='testplan-statistics'),
    path(
        'testplans/<int:pk>/histogram/',
        TestPLanStatisticsView.as_view({'get': 'get_histogram'}),
        name='testplan-histogram'
    ),
    path('testplans/<int:pk>/parents/', breadcrumbs_plans_view, name='testplan-breadcrumbs'),
    path('testplans/<int:pk>/activity/', activity_view, name='testplan-activity'),
    path('testplans/<int:pk>/progress/', views.TestPlanViewSet.as_view({'get': 'plan_progress'}), name='plan-progress'),
    path('testplans/<int:pk>/suites/', views.TestPlanViewSet.as_view({'get': 'suites_by_plan'}), name='suites-by-plan'),
    path('testplans/<int:pk>/cases/', views.TestPlanViewSet.as_view({'get': 'cases_by_plan'}), name='cases-by-plan'),
    path('testplans/<int:pk>/labels/', testplan_labels_view, name='testplan-labels'),

    path('testplans/<int:pk>/delete/preview/', views.TestPlanViewSet.as_view({'get': 'delete_preview'}),
         name='testplan-delete-preview'),
    path('testplans/deleted/', views.TestPlanViewSet.as_view({'get': 'recovery_list'}), name='testplan-deleted-list'),
    path('testplans/deleted/recover/', views.TestPlanViewSet.as_view({'post': 'restore'}),
         name='testplan-deleted-recover'),
    path('testplans/deleted/remove/', views.TestPlanViewSet.as_view({'post': 'delete_permanently'}),
         name='testplan-deleted-remove'),
    path('testplans/<int:pk>/archive/preview/', views.TestPlanViewSet.as_view({'get': 'archive_preview'}),
         name='testplan-archive-preview'),
    path('testplans/<int:pk>/archive/', views.TestPlanViewSet.as_view({'post': 'archive_objects'}),
         name='testplan-archive-commit'),
    path('testplans/archive/restore/', views.TestPlanViewSet.as_view({'post': 'restore_archived'}),
         name='testplan-archive-restore'),
    path('parameters/deleted/', views.ParameterViewSet.as_view({'get': 'recovery_list'}),
         name='parameter-deleted-list'),
    path('parameters/deleted/recover/', views.ParameterViewSet.as_view({'post': 'restore'}),
         name='parameter-deleted-recover'),
    path('parameters/deleted/remove/', views.ParameterViewSet.as_view({'post': 'delete_permanently'}),
         name='parameter-deleted-remove'),
    path('parameters/<int:pk>/delete/preview/', views.TestPlanViewSet.as_view({'get': 'delete_preview'}),
         name='parameter-delete-preview'),
    path('test-results/', TestResultChoicesView.as_view(), name='test-results'),
]
urlpatterns += router.urls

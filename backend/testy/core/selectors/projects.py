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

from django.db.models import Case, Exists, IntegerField, OuterRef, Q, QuerySet, Value, When
from rest_framework.generics import get_object_or_404

from testy.core.exceptions import UserMissingError
from testy.core.models import Project
from testy.tests_description.models import TestCase, TestSuite
from testy.tests_representation.models import Test, TestPlan
from testy.tests_representation.selectors.results import TestResultSelector
from testy.users.choices import UserAllowedPermissionCodenames
from testy.users.models import Membership, User
from testy.users.selectors.roles import RoleSelector
from testy.utilities.request import PeriodDateTime
from testy.utilities.sql import SubCount

_PK = 'pk'


class ProjectSelector:

    def __init__(self, user: User | None = None):
        self._user = user

    def project_list(self) -> QuerySet[Project]:
        qs = self._user_project_qs()
        return qs.order_by('name')

    @classmethod
    def project_list_raw(cls) -> QuerySet[Project]:
        return Project.objects.all().order_by('name')

    @classmethod
    def project_deleted_list(cls) -> QuerySet[Project]:
        return Project.deleted_objects.all()

    @classmethod
    def project_by_id(cls, project_id: int) -> Project:
        return get_object_or_404(Project, pk=project_id)

    def project_list_statistics(self):
        cases_count = TestCase.objects.filter(project_id=OuterRef(_PK), is_archive=False).values(_PK)  # noqa: WPS204
        suites_count = TestSuite.objects.filter(project_id=OuterRef(_PK)).values(_PK)
        plans_count = TestPlan.objects.filter(project_id=OuterRef(_PK), is_archive=False).values(_PK)
        tests_count = Test.objects.filter(project_id=OuterRef(_PK), is_archive=False).values(_PK)
        membership_exists = Exists(
            Membership.objects.filter(user__pk=self._user.pk, project=OuterRef(_PK)),
        )
        visible_condition = Case(
            When(
                condition=membership_exists | Value(self._user.is_superuser) | Q(is_private=False),
                then=True,
            ),
            default=False,
        )
        qs = self._user_project_qs()
        return qs.annotate(
            cases_count=SubCount(cases_count),
            suites_count=SubCount(suites_count),
            plans_count=SubCount(plans_count),
            tests_count=SubCount(tests_count),
            is_visible=visible_condition,
            is_manageable=Value(True) if self._user.is_superuser else Exists(
                Membership.objects.filter(
                    user__pk=self._user.pk,
                    project=OuterRef(_PK),
                    role__permissions__codename=UserAllowedPermissionCodenames.CHANGE_PROJECT,
                ),
            ),
        ).distinct()

    def all_projects_statistic(self):
        projects = self._user_project_qs().filter(is_archive=False)
        return {
            'projects_count': projects.count(),
            'cases_count': TestCase.objects.filter(is_archive=False, project__in=projects).count(),
            'suites_count': TestSuite.objects.filter(project__in=projects).count(),
            'plans_count': TestPlan.objects.filter(is_archive=False, project__in=projects).count(),
            'tests_count': Test.objects.filter(is_archive=False, project__in=projects).count(),
        }

    def project_progress(self, project_id: int, period: PeriodDateTime):
        last_status_period = TestResultSelector.get_last_status_subquery(
            filters=[Q(created_at__gte=period.start) & Q(created_at__lte=period.end)],
        )
        last_status_total = TestResultSelector.get_last_status_subquery()
        tests_total_query = Test.objects.filter(plan__tree_id=OuterRef('tree_id')).values(_PK)
        tests_progress_period = self._get_tests_subquery(last_status_period)
        tests_progress_total = self._get_tests_subquery(last_status_total)
        return TestPlan.objects.filter(
            parent=None, project=project_id, is_archive=False,
        ).prefetch_related(
            'parameters',
        ).annotate(
            tests_total=SubCount(tests_total_query),
            tests_progress_period=SubCount(tests_progress_period),
            tests_progress_total=SubCount(tests_progress_total),
        )

    @classmethod
    def favorites_annotation(cls, favorite_conditions: Q) -> Case:
        return Case(
            When(favorite_conditions, then=Value(0)),
            default=Value(1),
            output_field=IntegerField(),
        )

    @classmethod
    def _get_tests_subquery(cls, last_status_subquery):
        return Test.objects.annotate(last_status=last_status_subquery).filter(
            plan__tree_id=OuterRef('tree_id'),
            last_status__isnull=False,
        ).values(_PK)

    def _user_project_qs(self, manager_name: str = 'objects') -> QuerySet[Project]:
        if not self._user:
            raise UserMissingError('User must be set to get queryset')
        is_external = RoleSelector.restricted_project_access(self._user)
        manager = getattr(Project, manager_name)
        return manager.filter(members=self._user) if is_external else manager.all()

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
from typing import Iterable

from django.db.models import BooleanField, Case, F, OuterRef, Q, QuerySet, Subquery, Sum, When
from django.db.models.functions import Floor
from django.shortcuts import get_object_or_404
from mptt.querysets import TreeQuerySet

from testy.root.selectors import MPTTSelector
from testy.tests_description.models import TestCase, TestSuite
from testy.tests_description.selectors.cases import TestCaseSelector
from testy.tests_representation.models import Test
from testy.utilities.sql import ConcatSubquery, SubCount
from testy.utilities.tree import form_tree_prefetch_lookups, form_tree_prefetch_objects

_CHILD_TEST_SUITES = 'child_test_suites'
_TEST_CASES = 'test_cases'
_NAME = 'name'
_LFT = 'lft'
_RGHT = 'rght'
_TREE_ID = 'tree_id'


class TestSuiteSelector:  # noqa: WPS214
    @classmethod
    def get_max_level(cls) -> int:
        return MPTTSelector.model_max_level(TestSuite)

    @classmethod
    def suite_list_raw(cls) -> QuerySet[TestSuite]:
        return TestSuite.objects.all()

    @classmethod
    def suite_by_id(cls, suite_id: int) -> TestSuite:
        return get_object_or_404(TestSuite, pk=suite_id)

    def suite_deleted_list(self):
        max_level = self.get_max_level()
        return TestSuite.deleted_objects.all().prefetch_related(
            *form_tree_prefetch_objects(
                nested_prefetch_field=_CHILD_TEST_SUITES,
                prefetch_field=_CHILD_TEST_SUITES,
                tree_depth=max_level,
                queryset_class=TestSuite,
                manager_name='deleted_objects',
            ),
        )

    def suite_list(self) -> QuerySet[TestSuite]:
        max_level = self.get_max_level()
        return (
            TestSuite.objects.all()
            .order_by(_NAME)
            .prefetch_related(
                *self.suites_tree_prefetch_cases(max_level),
                *form_tree_prefetch_lookups(
                    _CHILD_TEST_SUITES,
                    'test_cases__attachments',
                    max_level,
                ),
                *form_tree_prefetch_lookups(
                    _CHILD_TEST_SUITES,
                    'test_cases__labeled_items__label',
                    max_level,
                ),
            )
            .annotate(**self.path_annotation())
        )

    def suites_by_plan(self, plan_id):
        suite_ids = Test.objects.filter(plan=plan_id).values_list('case__suite__id', flat=True)
        max_level = self.get_max_level()
        annotation_condition = Case(
            When(id__in=suite_ids, then=True),
            output_field=BooleanField(),
            default=False,
        )
        qs = TestSuite.objects.filter(id__in=suite_ids).get_ancestors(include_self=True)

        return qs.filter(parent=None).prefetch_related(
            *form_tree_prefetch_objects(
                _CHILD_TEST_SUITES,
                _CHILD_TEST_SUITES,
                tree_depth=max_level,
                queryset=qs,
                annotation={'is_used': annotation_condition},
            ),
        ).annotate(is_used=annotation_condition)

    def suite_list_treeview(self, root_only: bool = True) -> QuerySet[TestSuite]:
        max_level = self.get_max_level()
        parent = {'parent': None} if root_only else {}
        return (
            TestSuite.objects
            .filter(**parent)
            .order_by(_NAME)
            .prefetch_related(
                *self.suites_tree_prefetch_children(max_level),
            ).annotate(**self.cases_count_annotation())
        )

    @classmethod
    def suite_list_retrieve(cls):
        return TestSuite.objects.filter().order_by(_NAME).annotate(
            **cls.cases_count_annotation(),
            **cls.path_annotation(),
        )

    @classmethod
    def suite_list_ancestors(cls, instance: TestSuite) -> TreeQuerySet[TestSuite]:
        return instance.get_ancestors(include_self=True)

    @classmethod
    def suites_by_ids(cls, ids: Iterable[int], field_name: str) -> TreeQuerySet[TestSuite]:
        return TestSuite.objects.filter(**{f'{field_name}__in': ids}).order_by('id')

    @classmethod
    def suites_descendants(cls, suites: TreeQuerySet[TestSuite], include_self: bool = False) -> TreeQuerySet[TestSuite]:
        return suites.get_descendants(include_self=include_self).order_by('id')

    @classmethod
    def cases_count_annotation(cls):
        return {
            'descendant_count': Floor((F(_RGHT) - F(_LFT) - 1) / 2),
            'estimates': cls._get_estimate_sum_subquery(),
            'total_estimates': cls._get_estimate_sum_subquery(sum_descendants=True),
            'cases_count': SubCount(TestCase.objects.filter(is_archive=False, suite_id=OuterRef('pk'))),
            'total_cases_count': SubCount(
                TestCase.objects.filter(
                    Q(suite__tree_id=OuterRef(_TREE_ID))
                    & Q(suite__lft__gte=OuterRef(_LFT))  # noqa: W503
                    & Q(suite__rght__lte=OuterRef(_RGHT)),  # noqa: W503
                    is_archive=False,
                ),
            ),
        }

    @classmethod
    def suites_tree_prefetch_children(cls, max_level: int):
        return form_tree_prefetch_objects(
            nested_prefetch_field=_CHILD_TEST_SUITES,
            prefetch_field=_CHILD_TEST_SUITES,
            tree_depth=max_level,
            queryset_class=TestSuite,
            annotation=cls.cases_count_annotation(),
            order_by_fields=['name'],
        )

    @classmethod
    def suites_tree_prefetch_cases(cls, max_level: int):
        return form_tree_prefetch_objects(
            nested_prefetch_field=_CHILD_TEST_SUITES,
            prefetch_field='test_cases',
            tree_depth=max_level,
            queryset=TestCaseSelector().case_list(filter_condition={'is_archive': False}),
        )

    @classmethod
    def path_annotation(cls):
        ancestor_paths = TestSuite.objects.filter(
            lft__lte=OuterRef(_LFT),
            rght__gte=OuterRef(_RGHT),
            tree_id=OuterRef(_TREE_ID),
        ).order_by('id').values(_NAME)

        return {
            'path': ConcatSubquery(ancestor_paths, separator='/'),
        }

    @classmethod
    def _get_estimate_sum_subquery(cls, sum_descendants: bool = False):
        sum_condition = Q(test_cases__is_deleted=False) & Q(test_cases__is_archive=False)
        if sum_descendants:
            filter_condition = (
                Q(tree_id=OuterRef(_TREE_ID)) &  # noqa: W504
                Q(lft__gte=OuterRef(_LFT)) &  # noqa: W504
                Q(rght__lte=OuterRef(_RGHT))
            )
        else:
            filter_condition = Q(pk=OuterRef('pk'))

        return Subquery(
            TestSuite.objects.filter(filter_condition)
            .prefetch_related('test_cases')
            .values(_TREE_ID)
            .annotate(
                total=Sum('test_cases__estimate', filter=sum_condition),
            )
            .values('total'),
        )

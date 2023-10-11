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
from typing import List

from django.db.models import BooleanField, Case, Count, F, QuerySet, When
from django.db.models.functions import Floor
from mptt.querysets import TreeQuerySet
from tests_description.models import TestCase, TestSuite
from tests_representation.models import Test

from testy.selectors import MPTTSelector
from utils import form_tree_prefetch_lookups, form_tree_prefetch_objects


class TestSuiteSelector:
    def get_max_level(self) -> int:
        return MPTTSelector.model_max_level(TestSuite)

    @staticmethod
    def suite_list_raw() -> QuerySet[TestSuite]:
        return TestSuite.objects.all()

    def suite_deleted_list(self):
        max_level = self.get_max_level()
        return TestSuite.deleted_objects.all().prefetch_related(
            *form_tree_prefetch_objects(
                nested_prefetch_field='child_test_suites',
                prefetch_field='child_test_suites',
                tree_depth=max_level,
                queryset_class=TestSuite,
                manager_name='deleted_objects'
            ),
        )

    def suite_list(self) -> QuerySet[TestSuite]:
        max_level = self.get_max_level()
        return (
            TestSuite.objects.all()
            .order_by("name")
            .prefetch_related(
                *form_tree_prefetch_lookups(
                    'child_test_suites',
                    'test_cases',
                    max_level,
                ),
                *form_tree_prefetch_lookups(
                    'child_test_suites',
                    'test_cases__attachments',
                    max_level,
                ),
                *form_tree_prefetch_lookups(
                    'child_test_suites',
                    'test_cases__labeled_items__label',
                    max_level,
                ),
            )
        )

    def suites_by_plan(self, plan_id):
        suite_ids = Test.objects.filter(plan=plan_id).values_list('case__suite__id', flat=True)
        max_level = self.get_max_level()
        annotation_condition = Case(
            When(id__in=suite_ids, then=True),
            output_field=BooleanField(),
            default=False
        )
        qs = TestSuite.objects.filter(id__in=suite_ids).get_ancestors(include_self=True)

        root_suites = qs.filter(parent=None).prefetch_related(
            *form_tree_prefetch_objects(
                'child_test_suites',
                'child_test_suites',
                tree_depth=max_level,
                queryset=qs,
                annotation={'is_used': annotation_condition}
            ),
        ).annotate(is_used=annotation_condition)
        return root_suites

    def suite_list_treeview(self, root_only: bool = True) -> QuerySet[TestSuite]:
        max_level = self.get_max_level()
        parent = {'parent': None} if root_only else {}
        return (
            TestSuite.objects
            .filter(**parent)
            .order_by('name')
            .prefetch_related(
                *form_tree_prefetch_objects(
                    nested_prefetch_field='child_test_suites',
                    prefetch_field='child_test_suites',
                    tree_depth=max_level,
                    queryset_class=TestSuite,
                    annotation={
                        'cases_count': Count('test_cases'),
                        'descendant_count': Floor((F('rght') - F('lft') - 1) / 2)
                    },
                    order_by_fields=['name']
                ),
            ).annotate(
                cases_count=Count('test_cases'),
                descendant_count=Floor((F('rght') - F('lft') - 1) / 2)
            )
        )

    def suite_list_treeview_with_cases(self, root_only: bool = True) -> QuerySet[TestSuite]:
        max_level = self.get_max_level()
        parent = {'parent': None} if root_only else {}
        return (
            TestSuite.objects
            .filter(**parent)
            .order_by('name')
            .prefetch_related(
                *form_tree_prefetch_objects(
                    nested_prefetch_field='child_test_suites',
                    prefetch_field='child_test_suites',
                    tree_depth=max_level,
                    queryset_class=TestSuite,
                    annotation={
                        'cases_count': Count('test_cases'),
                        'descendant_count': Floor((F('rght') - F('lft') - 1) / 2)
                    },
                    order_by_fields=['name']
                ),
                *form_tree_prefetch_objects(
                    nested_prefetch_field='child_test_suites',
                    prefetch_field='test_cases',
                    tree_depth=max_level,
                    queryset_class=TestCase,
                ),
            ).annotate(
                cases_count=Count('test_cases'),
                descendant_count=Floor((F('rght') - F('lft') - 1) / 2)
            )
        )

    @staticmethod
    def suite_list_ancestors(instance: TestSuite) -> TreeQuerySet[TestSuite]:
        return instance.get_ancestors(include_self=True)

    @classmethod
    def suites_by_ids_list(cls, ids: List[int], field_name: str) -> TreeQuerySet[TestSuite]:
        return TestSuite.objects.filter(**{f'{field_name}__in': ids}).order_by('id')

    @classmethod
    def suites_descendants(cls, suites: TreeQuerySet[TestSuite], include_self: bool = False) -> TreeQuerySet[TestSuite]:
        return suites.get_descendants(include_self=include_self).order_by('id')

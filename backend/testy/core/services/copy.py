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
import re
from copy import deepcopy
from typing import Any, Callable, Dict, List, Optional, Tuple, TypeVar, Union

from core.models import Label, LabeledItem
from core.selectors.attachments import AttachmentSelector
from core.selectors.labeled_items import LabeledItemSelector
from core.selectors.labels import LabelSelector
from django.db import models, transaction
from django.db.models import QuerySet
from mptt.querysets import TreeQuerySet
from simple_history.utils import bulk_create_with_history
from tests_description.models import TestCase, TestCaseStep, TestSuite
from tests_description.selectors.cases import TestCaseSelector, TestCaseStepSelector
from tests_description.selectors.suites import TestSuiteSelector

_DMT = TypeVar('_DMT', bound=models.Model)
_Mapping = TypeVar('_Mapping', bound=Dict[int, int])


class CopyService:
    @classmethod
    @transaction.atomic
    def suites_copy(cls, data: Dict[str, Any]):
        dst_suite_id = None
        project_data = {}
        if project := data.get('dst_project_id'):
            project_data = {'project_id': project.id}
        if suite := data.get('dst_suite_id'):
            dst_suite_id = suite.id

        root_suites = TestSuiteSelector.suites_by_ids_list(data.get('suite_ids', []), 'pk')
        root_suite_mappings, tree_id_mapping, copied_root_suites = cls._copy_suites(
            root_suites,
            parent_id=dst_suite_id,
            **project_data
        )

        suite_mappings, copied_bulk_suites = cls._copy_suites_bulk(
            root_suites.get_descendants(include_self=False),
            field_to_mapping={'tree_id': tree_id_mapping},
            **project_data,
        )
        suite_mappings.update(root_suite_mappings)
        cls._update_suite_relations(copied_bulk_suites, suite_mappings)
        cases_to_copy = TestCaseSelector.cases_by_ids_list(
            root_suites.get_descendants(include_self=True).values_list('id', flat=True),
            'suite_id'
        )

        case_mappings = cls._copy_cases_bulk(
            cases_to_copy,
            field_to_mapping={'suite_id': suite_mappings},
            **project_data
        )
        steps_to_copy = TestCaseStepSelector.steps_by_ids_list(
            cases_to_copy.values_list('id', flat=True),
            'test_case_id'
        )

        steps_mapping = cls._copy_steps(steps_to_copy, case_mappings, **project_data)
        cls._copy_attachments(
            TestCase,
            cases_to_copy,
            case_mappings,
            project_data.get('project_id'),
            ['setup', 'scenario', 'expected', 'teardown', 'description'],
            TestCaseSelector.cases_by_ids_list
        )
        cls._copy_attachments(
            TestCaseStep,
            steps_to_copy,
            steps_mapping,
            project_data.get('project_id'),
            ['scenario', 'expected'],
            TestCaseStepSelector.steps_by_ids_list
        )
        labeled_cases = LabeledItemSelector.items_by_ids_list(
            cases_to_copy.values_list('id', flat=True),
            TestCase
        )

        cls._copy_labels_and_items(labeled_cases, case_mappings, project_data.get('project_id'))
        for suite in copied_root_suites:
            TestSuite.objects.partial_rebuild(suite.tree_id)
        return copied_root_suites

    @classmethod
    def _copy_suites(
        cls,
        suites: QuerySet[TestSuite],
        **kwargs
    ) -> Tuple[_Mapping, _Mapping, TreeQuerySet[TestSuite]]:
        suite_mappings = {}
        copied_suites = []
        copied_suites_ids = []
        for suite in suites:
            copied_suite = deepcopy(suite)
            copied_suite.pk = None
            for field_name, field_value in kwargs.items():
                setattr(copied_suite, field_name, field_value)
            if parent_id := suite_mappings.get(copied_suite.parent_id):
                copied_suite.parent_id = parent_id
            copied_suite.tree_id = 0
            copied_suite.lft = 0
            copied_suite.rght = 0
            copied_suite.save()
            copied_suites.append(copied_suite)
            copied_suites_ids.append(copied_suite.id)
            suite_mappings[suite.id] = copied_suite.id
        new_suites = TestSuiteSelector.suites_by_ids_list(copied_suites_ids, 'pk')
        tree_id_mapping = cls._map_ids(
            suites.all(),
            new_suites,
            mapping_key_objs='tree_id',
            mapping_key='tree_id'
        )
        return suite_mappings, tree_id_mapping, new_suites

    @classmethod
    def _copy_suites_bulk(
        cls,
        suites: TreeQuerySet[TestSuite],
        field_to_mapping: Dict[str, _Mapping],
        **kwargs
    ) -> Tuple[_Mapping, List[TestSuite]]:
        copied_suites = []
        for suite in suites:
            copied_suite = deepcopy(suite)
            copied_suite.pk = None
            for field_name, mapping in field_to_mapping.items():
                setattr(
                    copied_suite,
                    field_name,
                    mapping.get(
                        getattr(suite, field_name)
                    )
                )
            for field_name, field_value in kwargs.items():
                setattr(copied_suite, field_name, field_value)
            copied_suites.append(copied_suite)
        new_suites = TestSuite.objects.bulk_create(copied_suites)
        mapping = cls._map_ids(suites, new_suites)
        return mapping, new_suites

    @classmethod
    def _update_suite_relations(
        cls,
        suites: Union[List[TestSuite], TreeQuerySet[TestSuite]],
        suite_mappings: _Mapping,
    ) -> List[TestSuite]:
        updated_instances = []
        for suite in suites:
            if suite.parent_id:
                suite.parent_id = suite_mappings.get(suite.parent_id)
            updated_instances.append(suite)
        fields_to_update = ['parent_id']
        TestSuite.objects.bulk_update(
            updated_instances,
            fields_to_update
        )
        return updated_instances

    @classmethod
    def _copy_cases_bulk(
        cls,
        cases: QuerySet[TestCase],
        field_to_mapping: Dict[str, _Mapping],
        **kwargs
    ) -> _Mapping:
        new_case_models = []
        for case in cases:
            copied_case = deepcopy(case)
            copied_case.pk = None
            for field_name, mapping in field_to_mapping.items():
                setattr(
                    copied_case,
                    field_name,
                    mapping.get(
                        getattr(copied_case, field_name)
                    )
                )

            for field_name, field_value in kwargs.items():
                setattr(copied_case, field_name, field_value)

            new_case_models.append(copied_case)
        new_cases = bulk_create_with_history(new_case_models, TestCase)
        return cls._map_ids(cases, new_cases)

    @classmethod
    def _copy_labels_and_items(
        cls,
        labeled_items: QuerySet[LabeledItem],
        mapping: _Mapping,
        project_id: Optional[int]
    ):
        labels = LabelSelector.labels_by_ids_list(
            labeled_items.values_list('label_id', flat=True),
            'pk'
        )
        label_mappings = {}
        for label in labels:
            filter_conditions = {}
            default = {'name': label.name, 'type': label.type, 'project_id': label.project_id, 'user_id': label.user_id}
            if project_id:
                filter_conditions['project_id'] = project_id
                default['project_id'] = project_id
            new_label, _ = Label.objects.get_or_create(
                name__iexact=label.name,
                type=label.type,
                defaults=default,
                **filter_conditions
            )
            label_mappings[label.id] = new_label.id

        copied_labeled_items = []
        for labeled_item in labeled_items:
            labeled_item_copy = deepcopy(labeled_item)
            labeled_item_copy.pk = None
            labeled_item_copy.label_id = label_mappings.get(labeled_item_copy.label_id)
            labeled_item_copy.object_id = mapping.get(labeled_item_copy.object_id)
            copied_labeled_items.append(labeled_item_copy)
        LabeledItem.objects.bulk_create(copied_labeled_items)
        return label_mappings

    @classmethod
    def _copy_steps(
        cls,
        steps: QuerySet[TestCaseStep],
        case_mappings: _Mapping,
        **kwargs
    ) -> _Mapping:
        step_instances = []
        for step in steps:
            copied_step = deepcopy(step)
            copied_step.pk = None
            copied_step.test_case_id = case_mappings.get(copied_step.test_case_id)
            for field_name, field_value in kwargs.items():
                setattr(copied_step, field_name, field_value)
            step_instances.append(copied_step)
        copied_steps = TestCaseStep.objects.bulk_create(step_instances)
        return cls._map_ids(steps, copied_steps)

    @classmethod
    def _copy_attachments(
        cls,
        model: type[_DMT],
        objs: QuerySet[Any],
        mapping: _Mapping,
        project_id: Optional[int],
        attachment_references_fields: List[str],
        selector_method: Callable[[List[int], str], QuerySet[Any]],
    ):
        attachments = AttachmentSelector.attachment_by_ids_list(
            objs.values_list('id', flat=True),
            model
        )
        attachments_mapping = {}
        for attachment in attachments:
            attrs_to_change = {'object_id': mapping.get(attachment.object_id)}
            if project_id:
                attrs_to_change['project_id'] = project_id
            attachments_mapping[attachment.id] = attachment.model_clone(common_attrs_to_change=attrs_to_change).id
        updated_objs = []
        objs_to_update = selector_method(list(mapping.values()), 'pk')
        for obj in objs_to_update.filter(attachments__isnull=False):
            for field_name in attachment_references_fields:
                for old_id, new_id in attachments_mapping.items():
                    formatted_text = cls._change_attachments_reference(
                        getattr(obj, field_name), old_id, new_id
                    )
                    setattr(obj, field_name, formatted_text)
            updated_objs.append(obj)
        model.objects.bulk_update(updated_objs, attachment_references_fields)

    @classmethod
    def _map_ids(
        cls,
        key_objs: Union[QuerySet[Any], List[Any]],
        value_objs: Union[QuerySet[Any], List[Any]],
        *,
        mapping_key: str = 'id',
        mapping_key_objs: str = 'id'
    ):
        mapping = {}
        for key_obj, value_obj in zip(key_objs, value_objs):
            mapping[getattr(key_obj, mapping_key)] = getattr(value_obj, mapping_key_objs)
        return mapping

    @staticmethod
    def _change_attachments_reference(src_text: str, old_id: int, new_id: int):
        return re.sub(f'attachments/{old_id}/', f'attachments/{new_id}/', src_text)

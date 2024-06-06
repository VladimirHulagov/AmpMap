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
from typing import Any, Callable, Dict, Generator, Iterable, List, Optional, Tuple, TypeVar, Union

from django.db import transaction
from django.db.models import Model, QuerySet
from mptt.querysets import TreeQuerySet
from simple_history.utils import bulk_create_with_history

from testy.core.models import Label, LabeledItem
from testy.core.selectors.attachments import AttachmentSelector
from testy.core.selectors.labeled_items import LabeledItemSelector
from testy.core.selectors.labels import LabelSelector
from testy.tests_description.models import TestCase, TestCaseStep, TestSuite
from testy.tests_description.selectors.cases import TestCaseSelector, TestCaseStepSelector
from testy.tests_description.selectors.suites import TestSuiteSelector
from testy.tests_representation.models import Test, TestPlan
from testy.tests_representation.selectors.testplan import TestPlanSelector
from testy.utilities.sql import get_next_max_int_value, rebuild_mptt

_TModel = TypeVar('_TModel')
_Mapping = TypeVar('_Mapping', bound=dict[int, int])
_PROJECT_ID = 'project_id'
_PK = 'pk'
_ID = 'id'
_TREE_ID = 'tree_id'


class CopyService:
    @classmethod
    @transaction.atomic
    def plans_copy(cls, payload: dict[str, Any]):
        dst_plan = payload.get('dst_plan')
        plans_mapping = {}
        for plan_details in payload['plans']:
            plan_to_copy = plan_details.get('plan')
            copied_objects_generator = cls._create_tree_objects(
                dst_plan,
                [plan_to_copy],
                TestPlan,
                name=plan_details.get('new_name', plan_to_copy.name),
                started_at=plan_details.get('started_at', plan_to_copy.started_at),
                due_date=plan_details.get('due_date', plan_to_copy.due_date),
                finished_at=None,
            )
            plans_mapping.update(dict(copied_objects_generator))
        tests_to_copy = Test.objects.filter(plan__in=plans_mapping.keys())
        tests_copy_kwargs = {} if payload.get('keep_assignee') else {'assignee': None}
        cls._copy_objects(tests_to_copy, plans_mapping, 'plan_id', Test, **tests_copy_kwargs)
        tree_ids = [dst_plan.tree_id] if dst_plan else (
            TestPlanSelector.plan_list_by_ids(plans_mapping.values())
            .distinct()
            .values_list(_TREE_ID, flat=True)
        )

        for tree_id in tree_ids:
            rebuild_mptt(TestPlan, tree_id)

        return TestPlanSelector.plan_list_by_ids(plans_mapping.values())

    @classmethod
    @transaction.atomic
    def suites_copy(cls, data: Dict[str, Any]):
        dst_suite_id = None
        project_data = {}
        if project := data.get('dst_project_id'):
            project_data = {_PROJECT_ID: project.id}
        if suite := data.get('dst_suite_id'):
            dst_suite_id = suite.id
        suite_ids = [suite.get('id') for suite in data.get('suites', [])]
        root_suites = TestSuiteSelector.suites_by_ids(suite_ids, _PK)
        root_suite_mappings, tree_id_mapping, copied_root_suites = cls._copy_suites(
            root_suites,
            parent_id=dst_suite_id,
            **project_data,
        )

        suite_mappings, copied_bulk_suites = cls._copy_suites_bulk(
            root_suites.get_descendants(include_self=False),
            field_to_mapping={_TREE_ID: tree_id_mapping},
            **project_data,
        )
        suite_mappings.update(root_suite_mappings)
        cls._update_suite_relations(copied_bulk_suites, suite_mappings)
        cases_to_copy = TestCaseSelector.cases_by_ids_list(
            root_suites.get_descendants(include_self=True).values_list(_ID, flat=True),
            'suite_id',
        )

        case_mappings = cls._copy_cases_bulk(
            cases_to_copy,
            field_to_mapping={'suite_id': suite_mappings},
            **project_data,
        )
        steps_to_copy = TestCaseStepSelector.steps_by_ids_list(
            cases_to_copy.values_list(_ID, flat=True),
            'test_case_id',
        )

        steps_mapping = cls._copy_objects(
            steps_to_copy,
            case_mappings,
            'test_case_id',
            TestCaseStep,
            **project_data,
        )
        cls._copy_attachments(
            TestCase,
            cases_to_copy,
            case_mappings,
            project_data.get(_PROJECT_ID),
            ['setup', 'scenario', 'expected', 'teardown', 'description'],
            TestCaseSelector.cases_by_ids_list,
        )
        cls._copy_attachments(
            TestCaseStep,
            steps_to_copy,
            steps_mapping,
            project_data.get(_PROJECT_ID),
            ['scenario', 'expected'],
            TestCaseStepSelector.steps_by_ids_list,
        )
        labeled_cases = LabeledItemSelector.items_by_ids_list(
            cases_to_copy.values_list(_ID, flat=True),
            TestCase,
        )

        cls._copy_labels_and_items(labeled_cases, case_mappings, project_data.get(_PROJECT_ID))
        for suite in copied_root_suites:
            TestSuite.objects.partial_rebuild(suite.tree_id)
        for suite_dict in data.get('suites', []):
            if suite_dict.get('new_name') is None:
                continue
            copied_suite_id = root_suite_mappings.get(suite_dict.get('id'))
            TestSuite.objects.filter(pk=copied_suite_id).update(name=suite_dict.get('new_name'))
        return copied_root_suites.all()

    @classmethod
    def _copy_suites(
        cls,
        suites: QuerySet[TestSuite],
        **kwargs,
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
        new_suites = TestSuiteSelector.suites_by_ids(copied_suites_ids, _PK)
        tree_id_mapping = cls._map_ids(
            suites.all(),
            new_suites,
            mapping_key_objs=_TREE_ID,
            mapping_key=_TREE_ID,
        )
        return suite_mappings, tree_id_mapping, new_suites

    @classmethod
    def _copy_suites_bulk(
        cls,
        suites: TreeQuerySet[TestSuite],
        field_to_mapping: Dict[str, _Mapping],
        **kwargs,
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
                        getattr(suite, field_name),
                    ),
                )
            for field_name, field_value in kwargs.items():
                setattr(copied_suite, field_name, field_value)
            copied_suites.append(copied_suite)
        new_suites = TestSuite.objects.bulk_create(copied_suites)
        resulting_mapping = cls._map_ids(suites, new_suites)
        return resulting_mapping, new_suites

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
            fields_to_update,
        )
        return updated_instances

    @classmethod
    def _copy_cases_bulk(
        cls,
        cases: QuerySet[TestCase],
        field_to_mapping: Dict[str, _Mapping],
        **kwargs,
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
                        getattr(copied_case, field_name),
                    ),
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
        project_id: Optional[int],
    ):
        labels = LabelSelector.labels_by_ids_list(
            labeled_items.values_list('label_id', flat=True),
            _PK,
        )
        label_mappings = {}
        for label in labels:
            filter_conditions = {}
            default = {'name': label.name, 'type': label.type, _PROJECT_ID: label.project_id, 'user_id': label.user_id}
            if project_id:
                filter_conditions[_PROJECT_ID] = project_id
                default[_PROJECT_ID] = project_id
            new_label, _ = Label.objects.get_or_create(
                name__iexact=label.name,
                type=label.type,
                defaults=default,
                **filter_conditions,
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
    def _create_tree_objects(
        cls,
        new_parent: Optional[_TModel],
        instances: Iterable[_TModel],
        model: type[_TModel],
        parent_field_name: str = 'parent',
        **kwargs,
    ) -> Generator[tuple[int, int], None, None]:
        inherited_attrs = {'started_at', 'due_date', 'finished_at'}
        for instance in instances:
            copied_instance = deepcopy(instance)
            copied_instance.pk = None
            copied_instance.tree_id = new_parent.tree_id if new_parent else get_next_max_int_value(model, _TREE_ID)
            setattr(copied_instance, parent_field_name, new_parent)
            for field_name, field_value in kwargs.items():
                setattr(copied_instance, field_name, field_value)
            copied_instance.save()
            child_instances = model.objects.filter(**{parent_field_name: instance.pk})
            yield instance.pk, copied_instance.pk
            yield from cls._create_tree_objects(
                copied_instance,
                child_instances,
                model,
                parent_field_name,
                **{key: value for key, value in kwargs.items() if key in inherited_attrs},
            )

    @classmethod
    def _copy_attachments(
        cls,
        model: type[Model],
        objs: QuerySet[Any],
        mapping: _Mapping,
        project_id: Optional[int],
        attachment_references_fields: list[str],
        selector_method: Callable[[list[int], str], QuerySet[Any]],
    ) -> None:
        attachments = AttachmentSelector.attachment_by_ids_list(
            objs.values_list(_ID, flat=True),
            model,
        )
        attachments_mapping = {}
        for attachment in attachments:
            attrs_to_change = {'object_id': mapping.get(attachment.object_id)}
            if project_id:
                attrs_to_change[_PROJECT_ID] = project_id
            attachments_mapping[attachment.id] = attachment.model_clone(common_attrs_to_change=attrs_to_change).id
        updated_objs = []
        objs_to_update = selector_method(list(mapping.values()), _PK)
        for obj in objs_to_update.filter(attachments__isnull=False):
            for field_name in attachment_references_fields:
                for old_id, new_id in attachments_mapping.items():
                    formatted_text = cls._change_attachments_reference(
                        getattr(obj, field_name), old_id, new_id,
                    )
                    setattr(obj, field_name, formatted_text)
            updated_objs.append(obj)
        model.objects.bulk_update(updated_objs, attachment_references_fields)

    @classmethod
    def _copy_objects(
        cls,
        objs_to_copy: Iterable[Model],
        mapping: _Mapping,
        fk_field_name: str,
        model: type[Model],
        **kwargs,
    ) -> _Mapping:
        copied_instances = []
        for instance in objs_to_copy:
            copied_instance = deepcopy(instance)
            copied_instance.pk = None
            setattr(
                copied_instance,
                fk_field_name,
                mapping.get(
                    getattr(instance, fk_field_name),
                ),
            )
            for field_name, field_value in kwargs.items():
                setattr(copied_instance, field_name, field_value)
            copied_instances.append(copied_instance)
        if getattr(model, 'history', None):
            copied_instances = bulk_create_with_history(copied_instances, model)
        else:
            copied_instances = model.objects.bulk_create(copied_instances)
        return cls._map_ids(objs_to_copy, copied_instances)

    @classmethod
    def _map_ids(
        cls,
        key_objs: Iterable[Any],
        value_objs: Iterable[Any],
        *,
        mapping_key: str = _ID,
        mapping_key_objs: str = _ID,
    ):
        mapping = {}
        for key_obj, value_obj in zip(key_objs, value_objs):
            mapping[getattr(key_obj, mapping_key)] = getattr(value_obj, mapping_key_objs)
        return mapping

    @classmethod
    def _change_attachments_reference(cls, src_text: str, old_id: int, new_id: int):
        return re.sub(f'attachments/{old_id}/', f'attachments/{new_id}/', src_text)

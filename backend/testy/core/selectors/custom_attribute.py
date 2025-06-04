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
from collections import defaultdict
from typing import Any, List, TypeAlias

from core.choices import ArrayCompareOperator
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import ArrayField
from django.db.models import Case, F, Func, IntegerField, Q, QuerySet, TextField, Value, When
from django.db.models.fields.json import KT

from testy.core.constants import (
    CONTENT_TYPES_POSITIONS,
    CUSTOM_ATTRIBUTES_ALLOWED_APPS,
    CUSTOM_ATTRIBUTES_ALLOWED_MODELS,
)
from testy.core.models import CustomAttribute, Project
from testy.tests_description.models import TestSuite
from testy.tests_representation.models import ResultStatus

_NAME = 'name'
_APPLIED_TO_LOOKUP = 'applied_to__'

PayloadType: TypeAlias = dict[str, Any]


class CustomAttributeSelector:
    @classmethod
    def custom_attribute_list(cls) -> QuerySet[CustomAttribute]:
        return CustomAttribute.objects.all()

    @classmethod
    def required_attribute_names_by_project_and_suite(
        cls,
        project: Project,
        suite: TestSuite,
        content_type_name: str,
    ) -> QuerySet[CustomAttribute]:
        required_attr = cls._required_attributes_by_project_and_suite(project, suite, content_type_name)
        return required_attr.values_list(_NAME, flat=True)

    @classmethod
    def required_attribute_names_by_project(cls, project: Project, content_type_name: str) -> QuerySet[CustomAttribute]:
        return (
            cls
            ._attributes_by_project_and_model(project, content_type_name, is_required_only=True)
            .values_list(_NAME, flat=True)
        )

    @classmethod
    def required_attributes_by_status(
        cls,
        project: Project,
        suite: TestSuite,
        content_type_name: str,
        status: ResultStatus,
    ) -> QuerySet[CustomAttribute]:
        required_attr = cls._required_attributes_by_project_and_suite(
            project,
            suite,
            content_type_name,
        )
        return (
            cls.
            _filter_status_specific_attributes(required_attr, content_type_name, status.id)
            .values_list(_NAME, flat=True)
        )

    @classmethod
    def separated_attributes(
        cls,
        project_id: int,
        content_type_name: str,
        status_id: int | None = None,
        suite_ids: List[int] | None = None,
    ) -> dict[str, list[PayloadType]]:
        project = Project.objects.filter(pk=project_id).first()
        status = ResultStatus.objects.filter(pk=status_id).first()
        suite_ids = suite_ids or []

        non_suite_specific = cls._get_non_suite_specific_attributes(project, content_type_name)
        suite_specific = cls._get_suite_specific_attributes_by_suite_ids(
            project,
            content_type_name,
            suite_ids,
            operator=ArrayCompareOperator.OVERLAP,
        )

        if status is not None:
            non_suite_specific = cls._filter_status_specific_attributes(
                non_suite_specific,
                content_type_name,
                status.id,
            )
            suite_specific = cls._filter_status_specific_attributes(
                suite_specific,
                content_type_name,
                status.id,
            )

        suite_ids_lookup = f'{_APPLIED_TO_LOOKUP}{content_type_name}__suite_ids'
        is_required_lookup = f'{_APPLIED_TO_LOOKUP}{content_type_name}__is_required'
        non_suite_specific = list(non_suite_specific.values(_NAME, is_required_lookup))
        suite_specific = list(suite_specific.values(_NAME, suite_ids_lookup, is_required_lookup))
        result_attributes = {
            'non_suite_specific': [
                {
                    _NAME: attr[_NAME],
                    'is_required': attr[is_required_lookup],
                } for attr in non_suite_specific
            ],
        }
        suite_dict = defaultdict(list)
        suites = TestSuite.objects.filter(id__in=suite_ids).values(_NAME, 'id')
        for attribute in suite_specific:
            name = attribute[_NAME]
            is_required = attribute[is_required_lookup]
            for suite_id in suite_ids:
                if suite_id in attribute[suite_ids_lookup]:
                    suite_dict[suite_id].append({_NAME: name, 'is_required': is_required})
        result_attributes['suite_specific'] = [
            {
                'suite_id': suite_id,
                'suite_name': next(st[_NAME] for st in suites if st['id'] == suite_id),
                'values': attr_values,
            } for suite_id, attr_values in suite_dict.items()
        ]
        return result_attributes

    @classmethod
    def get_allowed_content_types(cls) -> QuerySet[ContentType]:
        conditions_list = []
        for model_name, position in CONTENT_TYPES_POSITIONS:
            conditions_list.append(When(model=model_name, then=position))
        return (
            ContentType
            .objects
            .annotate(ordering=Case(*conditions_list, default=0, output_field=IntegerField()))
            .filter(
                app_label__in=CUSTOM_ATTRIBUTES_ALLOWED_APPS,
                model__in=CUSTOM_ATTRIBUTES_ALLOWED_MODELS,
            )
            .order_by('ordering', 'id')
        )

    @classmethod
    def _required_attributes_by_project_and_suite(
        cls, project: Project, suite: TestSuite, content_type_name: str,
    ) -> QuerySet[CustomAttribute]:
        non_suite_specific = cls._get_non_suite_specific_attributes(project, content_type_name, is_required_only=True)
        suite_specific = cls._get_suite_specific_attributes_by_suite_ids(
            project,
            content_type_name,
            [suite.id],
            is_required_only=True,
        )
        return non_suite_specific | suite_specific

    @classmethod
    def _filter_status_specific_attributes(
        cls,
        queryset: QuerySet[CustomAttribute],
        content_type_name: str,
        status_id: int,
    ) -> QuerySet[CustomAttribute]:
        filter_status_specific_lookup = f'{_APPLIED_TO_LOOKUP}{content_type_name}__status_specific'
        status_specific_condition = Q(**{f'{filter_status_specific_lookup}__contains': [status_id]})
        status_specific_condition |= Q(**{filter_status_specific_lookup: []})
        return queryset.filter(status_specific_condition)

    @classmethod
    def _get_non_suite_specific_attributes(
        cls,
        project: Project,
        content_type_name: str,
        is_required_only: bool = False,
    ):
        attrs = cls._attributes_by_project_and_model(project, content_type_name, is_required_only=is_required_only)
        non_suite_specific_condition = Q(**{f'{_APPLIED_TO_LOOKUP}{content_type_name}__suite_ids': []})
        non_suite_specific_condition |= ~Q(**{f'{_APPLIED_TO_LOOKUP}{content_type_name}__has_key': 'suite_ids'})
        return attrs.filter(non_suite_specific_condition)

    @classmethod
    def _get_suite_specific_attributes(
        cls,
        project: Project,
        content_type_name: str,
        is_required_only: bool = False,
    ):
        suite_ids_lookup = f'{_APPLIED_TO_LOOKUP}{content_type_name}__suite_ids'
        attrs = cls._attributes_by_project_and_model(project, content_type_name, is_required_only=is_required_only)
        non_suite_specific_condition = Q(**{f'{_APPLIED_TO_LOOKUP}{content_type_name}__has_key': 'suite_ids'})
        non_suite_specific_condition &= ~Q(**{suite_ids_lookup: []})
        return attrs.filter(non_suite_specific_condition)

    @classmethod
    def _get_suite_specific_attributes_by_suite_ids(
        cls,
        project: Project,
        content_type_name: str,
        suite_ids: list[int],
        is_required_only: bool = False,
        operator: ArrayCompareOperator = ArrayCompareOperator.CONTAINS,
    ):
        suite_ids_lookup = f'{_APPLIED_TO_LOOKUP}{content_type_name}__suite_ids'
        attrs = cls._attributes_by_project_and_model(project, content_type_name, is_required_only=is_required_only)

        if operator == ArrayCompareOperator.CONTAINS:
            return attrs.filter(
                **{f'{suite_ids_lookup}__{operator.value}': suite_ids},
            )
        attrs = attrs.annotate(
            ids_str=Func(
                KT(suite_ids_lookup),
                Value('[]', output_field=TextField()),
                function='BTRIM',
            ),
            ids_array=Func(
                F('ids_str'),
                Value(',\s*', output_field=TextField()),  # noqa: W605
                function='regexp_split_to_array',
                output_field=ArrayField(TextField()),
            ),
        )
        return attrs.filter(ids_array__overlap=suite_ids)

    @classmethod
    def _attributes_by_project_and_model(
        cls,
        project: Project,
        model_name: str,
        is_required_only: bool = False,
    ) -> QuerySet[CustomAttribute]:
        filter_condition = {'project': project}
        filter_condition['applied_to__has_key'] = model_name
        if is_required_only:
            filter_condition[f'applied_to__{model_name}__is_required'] = True
        return CustomAttribute.objects.filter(**filter_condition)

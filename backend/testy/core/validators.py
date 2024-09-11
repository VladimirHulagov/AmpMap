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
from functools import partial
from typing import Any, Iterable, Protocol

from django.contrib.contenttypes.models import ContentType
from django.utils.deconstruct import deconstructible
from rest_framework import serializers

from testy.core.models import CustomAttribute, Project
from testy.core.selectors.custom_attribute import CustomAttributeSelector
from testy.tests_description.models import TestCase, TestSuite


class ReturnsRequiredAttrs(Protocol):
    def __call__(self, content_type_id: int) -> Iterable[CustomAttribute]:
        """
        Protocol for returning a list of required attributes.

        Args:
            content_type_id: The content type ID to filter by.
        """


@deconstructible
class CustomAttributeCreateValidator:
    requires_context = True

    def __call__(self, attrs: dict[str, Any], serializer):
        project = attrs.get('project')
        is_suite_specific = attrs.get('is_suite_specific')
        suites = attrs.get('suite_ids')

        if not project and serializer.instance:
            project = serializer.instance.project

        self._validate_suite_related_fields(suites, is_suite_specific)
        self._validate_all_suites_project_related(project, suites, is_suite_specific)

    @classmethod
    def _validate_suite_related_fields(cls, suite_ids: list[int], is_suite_specific: bool):
        if is_suite_specific and not suite_ids:
            raise serializers.ValidationError('Empty suites list, while attribute is suite-specific')
        elif not is_suite_specific and suite_ids:
            raise serializers.ValidationError('Provided suites list, while attribute is not suite-specific')

    @classmethod
    def _validate_all_suites_project_related(cls, project: Project, suite_ids: list[int], is_suite_specific: bool):
        if not cls._is_project_includes_all_suites(project, suite_ids, is_suite_specific):
            raise serializers.ValidationError('Field suite_ids contains non project-related items')

    @classmethod
    def _is_project_includes_all_suites(cls, project: Project, suite_ids: list[int], is_suite_specific: bool) -> bool:
        if not is_suite_specific:
            return True

        requested_suites_count = len(suite_ids)
        found_suites_count = cls._suites_count_by_project_and_ids(project, suite_ids)

        return found_suites_count == requested_suites_count

    @classmethod
    def _suites_count_by_project_and_ids(cls, project: Project, suite_ids: list[int]) -> int:
        return TestSuite.objects.filter(project=project, id__in=suite_ids).count()


class BaseCustomAttributeValuesValidator:
    app_name = ''
    model_name = ''

    @classmethod
    def _validate(cls, attributes: dict, required_attrs_getter: ReturnsRequiredAttrs):
        content_type_id = ContentType.objects.get(app_label=cls.app_name, model=cls.model_name).id
        required_attributes = required_attrs_getter(content_type_id=content_type_id)
        if diff := set(required_attributes).difference(set(attributes.keys())):
            diff_list = list(diff)
            raise serializers.ValidationError(f'Missing following required attributes: {diff_list}')

        if empty_attributes := [name for name in required_attributes if not attributes[name]]:
            raise serializers.ValidationError(f'Found empty required attributes: {empty_attributes}')


@deconstructible
class TestCaseCustomAttributeValuesValidator(BaseCustomAttributeValuesValidator):
    app_name = 'tests_description'
    model_name = 'testcase'

    def __call__(self, attrs: dict[str, Any]):
        custom_attr = attrs.get('attributes', {})
        project = attrs['project']
        suite = attrs['suite']

        attr_getter = partial(
            CustomAttributeSelector.required_attribute_names_by_project_and_suite,
            project=project,
            suite=suite,
        )
        self._validate(custom_attr, attr_getter)


class ProjectStatusOrderValidator:
    def __call__(self, status_order):
        if not isinstance(status_order, dict):
            raise serializers.ValidationError('Status order must be dict')
        for key, value in status_order.items():
            if not (str(key).isdigit() and str(value).isdigit()):
                raise serializers.ValidationError('Key and value in Status order should contain digits')
        return status_order


class CasesCopyProjectValidator:
    def __call__(self, attrs: dict[str, Any]):
        dst_suite = attrs.get('dst_suite_id')
        if not dst_suite:
            return
        cases_ids = [case['id'] for case in attrs.get('cases')]
        cases = TestCase.objects.filter(pk__in=cases_ids)
        cases_projects = cases.values_list('project_id', flat=True).distinct('project_id')
        if cases_projects.count() != 1 or cases_projects[0] != dst_suite.project_id:
            raise serializers.ValidationError('Cannot copy case to another project.')

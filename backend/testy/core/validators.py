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
from typing import Any, Dict, List

from django.contrib.contenttypes.models import ContentType
from django.utils.deconstruct import deconstructible
from rest_framework import serializers

from testy.core.models import Project
from testy.core.selectors.custom_attribute import CustomAttributeSelector
from testy.tests_description.models import TestSuite


@deconstructible
class CustomAttributeCreateValidator:
    requires_context = True

    def __call__(self, attrs: Dict[str, Any], serializer):
        project = attrs.get('project')
        is_suite_specific = attrs.get('is_suite_specific')
        suites = attrs.get('suite_ids')

        if not project and serializer.instance:
            project = serializer.instance.project

        self._validate_suite_related_fields(suites, is_suite_specific)
        self._validate_all_suites_project_related(project, suites, is_suite_specific)

    @classmethod
    def _validate_suite_related_fields(cls, suite_ids: List[int], is_suite_specific: bool):
        if is_suite_specific and not suite_ids:
            raise serializers.ValidationError('Empty suites list, while attribute is suite-specific')

        elif not is_suite_specific and suite_ids:
            raise serializers.ValidationError('Provided suites list, while attribute is not suite-specific')

    @classmethod
    def _validate_all_suites_project_related(cls, project: Project, suite_ids: List[int], is_suite_specific: bool):
        if not cls._is_project_includes_all_suites(project, suite_ids, is_suite_specific):
            raise serializers.ValidationError('Field suite_ids contains non project-related items')

    @classmethod
    def _is_project_includes_all_suites(cls, project: Project, suite_ids: List[int], is_suite_specific: bool) -> bool:
        if not is_suite_specific:
            return True

        requested_suites_count = len(suite_ids)
        found_suites_count = cls._suites_count_by_project_and_ids(project, suite_ids)

        return found_suites_count == requested_suites_count

    @classmethod
    def _suites_count_by_project_and_ids(cls, project: Project, suite_ids: List[int]) -> int:
        return TestSuite.objects.filter(project=project, id__in=suite_ids).count()


class BaseCustomAttributeValuesValidator:
    app_name = ''
    model_name = ''

    @classmethod
    def _validate(cls, project: Project, suite: TestSuite, attributes: dict):
        content_type_id = ContentType.objects.get(app_label=cls.app_name, model=cls.model_name).id
        required_attributes = CustomAttributeSelector.required_attribute_names_by_project_and_suite(
            project, suite, content_type_id,
        )

        if diff := set(required_attributes).difference(set(attributes.keys())):
            diff_list = list(diff)
            raise serializers.ValidationError(f'Missing following required attributes: {diff_list}')

        if empty_attributes := [name for name in required_attributes if not attributes[name]]:
            raise serializers.ValidationError(f'Found empty required attributes: {empty_attributes}')


@deconstructible
class TestCaseCustomAttributeValuesValidator(BaseCustomAttributeValuesValidator):
    app_name = 'tests_description'
    model_name = 'testcase'

    def __call__(self, attrs: Dict[str, Any]):
        custom_attr = attrs.get('attributes', {})
        project = attrs['project']
        suite = attrs['suite']
        self._validate(project, suite, custom_attr)


@deconstructible
class TestResultCustomAttributeValuesValidator(BaseCustomAttributeValuesValidator):
    app_name = 'tests_representation'
    model_name = 'testresult'
    requires_context = True

    def __call__(self, attrs: Dict[str, Any], serializer):
        custom_attr = attrs.get('attributes', {})
        if test := attrs.get('test'):
            project = test.project
            suite = test.case.suite
        elif instance := serializer.instance:
            project = instance.project
            suite = instance.test.case.suite
        else:
            return

        self._validate(project, suite, custom_attr)

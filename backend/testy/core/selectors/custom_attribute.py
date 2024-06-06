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
from django.contrib.contenttypes.models import ContentType
from django.db.models import QuerySet

from testy.core.constants import CUSTOM_ATTRIBUTES_ALLOWED_APPS, CUSTOM_ATTRIBUTES_ALLOWED_MODELS
from testy.core.models import CustomAttribute, Project
from testy.tests_description.models import TestSuite

_NAME = 'name'


class CustomAttributeSelector:
    @classmethod
    def custom_attribute_list(cls) -> QuerySet[CustomAttribute]:
        return CustomAttribute.objects.all()

    @classmethod
    def required_attribute_names_by_project_and_suite(
        cls, project: Project, suite: TestSuite, content_type_id: int,
    ) -> QuerySet[CustomAttribute]:
        required_attr = cls._required_attributes_by_project_and_suite(project, suite, content_type_id)
        return required_attr.values_list(_NAME, flat=True)

    @classmethod
    def get_allowed_content_types(cls) -> QuerySet[ContentType]:
        return ContentType.objects.filter(
            app_label__in=CUSTOM_ATTRIBUTES_ALLOWED_APPS, model__in=CUSTOM_ATTRIBUTES_ALLOWED_MODELS,
        )

    @classmethod
    def _required_attributes_by_project_and_suite(
        cls, project: Project, suite: TestSuite, content_type_id: int,
    ) -> QuerySet[CustomAttribute]:
        required_attr = cls._required_attributes_by_project(project)
        non_suite_specific = required_attr.filter(is_suite_specific=False, content_types__contains=[content_type_id])
        suite_specific = required_attr.filter(
            is_suite_specific=True,
            suite_ids__contains=[suite.id],
            content_types__contains=[content_type_id],
        )
        return non_suite_specific | suite_specific

    @classmethod
    def _required_attributes_by_project(cls, project: Project) -> QuerySet[CustomAttribute]:
        return CustomAttribute.objects.all().filter(project=project, is_required=True)

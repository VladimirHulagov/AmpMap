# TestY TMS - Test Management System
# Copyright (C) 2022 KNS Group LLC (YADRO)
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
from typing import Any

from django.contrib.contenttypes.models import ContentType

from testy.core.models import CustomAttribute


class CustomAttributeService:
    non_side_effect_fields = [
        'name', 'project', 'type', 'is_required', 'is_suite_specific', 'suite_ids', 'status_specific',
    ]

    @classmethod
    def custom_attribute_create(cls, data: dict[str, Any]) -> CustomAttribute:
        custom_attribute = CustomAttribute.model_create(
            fields=cls.non_side_effect_fields,
            data=data,
            commit=False,
        )
        custom_attribute.content_types = cls._get_content_type_ids(data.get('content_types'))
        custom_attribute.full_clean()
        custom_attribute.save()
        return custom_attribute

    @classmethod
    def custom_attribute_update(cls, custom_attribute: CustomAttribute, data: dict[str, Any]) -> CustomAttribute:
        custom_attribute, _ = custom_attribute.model_update(
            fields=cls.non_side_effect_fields,
            data=data,
            commit=False,
        )
        if content_types := data.get('content_types', []):
            custom_attribute.content_types = cls._get_content_type_ids(content_types)
        custom_attribute.full_clean()
        custom_attribute.save()
        return custom_attribute

    @classmethod
    def _get_content_type_ids(cls, content_types: list[ContentType]) -> list[int]:
        return [content_type.id for content_type in content_types]

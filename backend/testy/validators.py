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
import datetime
import os
from itertools import chain
from typing import TYPE_CHECKING, Any, Iterable, Mapping, Optional, Protocol

import pytimeparse
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import FieldDoesNotExist, ValidationError
from django.db.models import Model
from django.utils.deconstruct import deconstructible
from django.utils.timezone import now, timedelta
from rest_framework import serializers
from rest_framework.exceptions import ValidationError as DRFValidationError
from utilities.time import WorkTimeProcessor

from testy.core.selectors.project_settings import ProjectSettings
from testy.tests_representation.choices import TestStatuses

_ID = 'id'

if TYPE_CHECKING:
    from django.db.models.manager import RelatedManager


class Comparator(Protocol):
    def __call__(self, old_value: Any, new_value: Any) -> bool:
        """
        Return True if objects are equal False otherwise.

        Args:
            old_value: first value to compare.
            new_value: second value to compare.
        """


FieldsToComparator = tuple[Iterable[str], Comparator]


@deconstructible
class ExtensionValidator:
    def __call__(self, file):
        name, extension = os.path.splitext(file.name)
        if settings.ALLOWED_FILE_EXTENSIONS and extension not in settings.ALLOWED_FILE_EXTENSIONS:
            message = f'Extension not allowed. Allowed extensions are: {settings.ALLOWED_FILE_EXTENSIONS}'
            raise serializers.ValidationError(message)


@deconstructible
class ProjectValidator:
    def __call__(self, value):
        if not isinstance(value, ContentType):
            return
        try:
            value.model_class()._meta.get_field('project')
        except FieldDoesNotExist:
            if value.model != 'project':
                raise serializers.ValidationError(f'{value} does not have parent project nor project itself')


def compare_related_manager(old_value: 'RelatedManager', new_value: Iterable[Model]) -> bool:
    new_qs = old_value.model.objects.filter(pk__in=[instance.pk for instance in new_value])
    old_qs = old_value.all()
    return not bool(old_qs.difference(new_qs))


def compare_steps(old_value: 'RelatedManager', new_value: list[Mapping[str, Any]]) -> bool:
    old_step_results = old_value.all().order_by(_ID)
    new_value.sort(key=lambda elem: elem.get(_ID))
    for old_step, new_step in zip(old_step_results, new_value):
        if old_step.id != new_step.get(_ID) or old_step.status != new_step.get('status'):  # noqa: WPS221
            return False
    return True


@deconstructible
class TestResultUpdateValidator:
    requires_context = True

    def __init__(self, fields_to_comparator: Iterable[FieldsToComparator]):
        self._fields_to_comparator = fields_to_comparator

    def __call__(self, attrs, serializer):  # noqa: WPS231
        instance = serializer.instance
        payload_attrs = set(attrs.keys())
        attrs_to_validate = chain(*(elem[0] for elem in self._fields_to_comparator))

        time_limited_fields = set(payload_attrs).intersection(set(attrs_to_validate))

        if not instance or not time_limited_fields:
            return

        project_settings = ProjectSettings(**instance.project.settings)

        if not project_settings.is_result_editable:
            raise ValidationError('Results in this project are not editable. Contact with project admin')

        creation_timedelta = now() - instance.created_at
        version_changed = instance.test_case_version != instance.test.case.history.first().history_id
        time_over = (
            project_settings.result_edit_limit
            and creation_timedelta > timedelta(seconds=project_settings.result_edit_limit)
        )
        update_forbidden = time_over or version_changed
        err_msg = self._default_error_message(project_settings.result_edit_limit)

        if version_changed:
            err_msg = 'Test case version changed you can only update "comment" on current result'
        for fields, are_equal in self._fields_to_comparator:
            for field in fields:
                if field not in attrs:
                    continue
                if not are_equal(getattr(instance, field), attrs.get(field)) and update_forbidden:
                    raise ValidationError(err_msg)

    @classmethod
    def _default_error_message(cls, result_edit_limit: Optional[int]):
        if result_edit_limit is None:
            return None
        result_edit_limit_str = WorkTimeProcessor.format_duration(result_edit_limit, to_workday=False)
        return f"""Update gap closed, you can only update "comment" on this result.\n
        Update gap is set to "{result_edit_limit_str}"
        """  # noqa: S608


@deconstructible
class TestResultArchiveTestValidator:
    requires_context = True

    def __call__(self, attrs, serializer):
        instance = serializer.instance
        test = attrs.get('test') or serializer.instance.test
        if test.is_archive and not instance:
            raise ValidationError('Can not create a result in an archived test')
        if instance and (test.is_archive or instance.is_archive):
            raise ValidationError('Can not update result in an archived test/archived result')


@deconstructible
class TestResultStatusValidator:

    def __call__(self, status):
        if status == TestStatuses.UNTESTED:
            raise DRFValidationError('Setting status to UNTESTED is forbidden')


@deconstructible
class EstimateValidator:
    def __call__(self, value):  # noqa: WPS238, WPS231
        estimate = value.get('estimate')
        if not estimate:
            return
        estimate = estimate.strip()
        if estimate[0] == '-':
            raise ValidationError('Estimate value cannot be negative.')
        for week_alias in ('w', 'wk', 'week', 'weeks'):
            if week_alias in estimate:
                raise ValidationError('Max estimate period is a day')
        estimate = f'{estimate}m' if estimate.isnumeric() else estimate
        secs = pytimeparse.parse(estimate)
        if not secs:
            raise ValidationError('Invalid estimate format.')
        try:
            datetime.timedelta(seconds=secs)
        except OverflowError:
            raise ValidationError('Estimate value is too big.')


@deconstructible
class CaseInsensitiveUsernameValidator:
    def __call__(self, value):
        if get_user_model().objects.filter(username__iexact=value).exclude(username=value).exists():
            raise ValidationError(
                [{'username': ['A user with that username in a different letter case already exists.']}],
            )


@deconstructible
class DateRangeValidator:
    def __call__(self, attrs):
        started_at = attrs.get('started_at')
        due_date = attrs.get('due_date')

        if started_at and due_date and started_at >= due_date:
            raise ValidationError('End date must be greater than start date.')


@deconstructible
class TestPlanParentValidator:
    def __call__(self, attrs):
        parent = attrs.get('parent')
        if not parent:
            return
        archived_ancestors = parent.get_ancestors(include_self=True).filter(is_archive=True)
        if archived_ancestors:
            ids = list(archived_ancestors.values_list(_ID, flat=True))
            raise serializers.ValidationError(
                f'Cannot make child to an archived ancestor, archive ancestors ids are: {ids}',
            )

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
from operator import itemgetter

import pytimeparse
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import FieldDoesNotExist, ValidationError
from django.utils.deconstruct import deconstructible
from django.utils.timezone import now, timedelta
from rest_framework import serializers


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


@deconstructible
class TestResultUpdateValidator:
    requires_context = True

    def __init__(self, time_limited_fields):
        self.time_limited_fields = time_limited_fields

    def __call__(self, attrs, serializer):
        instance = serializer.instance

        request_time_limited_fields = set(attrs.keys()).intersection(set(self.time_limited_fields))

        if not instance or not request_time_limited_fields:
            return

        creation_timedelta = now() - instance.created_at
        version_changed = instance.test_case_version != instance.test.case.history.first().history_id
        update_forbidden = creation_timedelta > timedelta(hours=settings.TEST_RESULT_UPDATE_GAP) or version_changed

        err_msg = (
            f'Update gap closed, you can only update "comment" on this result.\n'
            f'Update gap is set to "{settings.TEST_RESULT_UPDATE_GAP}" hours'
        )

        if version_changed:
            err_msg = 'Test case version changed you can only update "comment" on current result'

        for field_name, field_value in attrs.items():
            fields_are_equal = self._compare_fields(field_name, getattr(instance, field_name), field_value)
            is_time_limited = field_name in self.time_limited_fields
            if all([not fields_are_equal, is_time_limited, update_forbidden]):
                raise serializers.ValidationError(err_msg)

    @staticmethod
    def _compare_fields(field_name: str, old_value, new_value):
        related_managers = ['steps_results', 'attachments']
        if field_name not in related_managers:
            return old_value == new_value

        if field_name == 'attachments':
            old_value = list(old_value.all().order_by('id').values_list('id', flat=True))
            return old_value == new_value

        old_steps = old_value.all()
        new_value.sort(key=itemgetter('id'))
        if len(old_steps) != len(new_value):
            return False
        for old_step, new_step in zip(old_steps, new_value):
            for step_field, step_field_value in new_step.items():
                if getattr(old_step, step_field) != step_field_value:
                    return False
        return True


@deconstructible
class EstimateValidator:
    def __call__(self, value):
        estimate = value.get('estimate')
        if not estimate:
            return None
        estimate = estimate.strip()
        if estimate[0] == '-':
            raise ValidationError('Estimate value cannot be negative.')
        for week_alias in ('w', 'wk', 'week', 'weeks'):
            if week_alias in estimate:
                raise ValidationError('Max estimate period is a day')
        estimate = estimate + 'm' if estimate.isnumeric() else estimate
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
                [{'username': ["A user with that username in a different letter case already exists."]}]
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
            ids = list(archived_ancestors.values_list('id', flat=True))
            raise serializers.ValidationError(
                f'Cannot make child to an archived ancestor, archive ancestors ids are: {ids}'
            )

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
__all__ = (
    'get_boolean',
    'get_datetime',
    'PeriodDateTime'
)

from dataclasses import dataclass
from typing import Optional

from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from utils import parse_bool_from_str


def get_boolean(request, key, method='GET', *, default=False):
    """
    Gets the value from request and returns it's boolean state
    """
    value = getattr(request, method).get(key, default)
    return parse_bool_from_str(value)


def get_datetime(request, key, method='GET', required=False) -> Optional[timezone.datetime]:
    """
    Gets the value from request and returns it's as datetime object
    """

    str_value = getattr(request, method).get(key)
    try:
        dt = timezone.datetime.fromisoformat(str_value)
        return timezone.make_aware(dt, timezone.utc)
    except (ValueError, TypeError) as e:
        if required:
            raise ValidationError(f'Invalid {method} parameter {key}: {e}')


@dataclass
class PeriodDateTime:
    start: timezone.datetime
    end: timezone.datetime

    def __init__(self, request, start_key: str, end_key: str):
        self.start = get_datetime(request, start_key)
        self.end = get_datetime(request, end_key)
        if self.start is None or self.end is None:
            self.end = timezone.now()
            self.start = self.end - timezone.timedelta(days=settings.PROJECT_PROGRESS_FILTER_PERIOD_IN_DAYS)
        self.start = self._format_date(self.start)
        self.end = self._format_date(self.end, is_start=False)

    @staticmethod
    def _format_date(date: timezone.datetime, is_start=True):
        if is_start:
            return date.replace(hour=0, minute=0, second=0)
        return date.replace(hour=23, minute=59, second=59)

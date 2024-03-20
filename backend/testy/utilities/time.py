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
from types import MappingProxyType

from django.conf import settings

PERIODS_IN_SECONDS = MappingProxyType(
    {
        'days': 60 * 60 * settings.WORK_HOURS,
        'hours': 60 * 60,
        'minutes': 60,
        'seconds': 1,
    },
)


class WorkTimeProcessor:
    DAY_IN_SECONDS = 60 * 60 * 24

    @classmethod
    def format_duration(cls, seconds: int):
        result = []
        for name, count in PERIODS_IN_SECONDS.items():
            value = seconds // count
            if value:
                seconds -= value * count
                result.append('{0}{1}'.format(value, name[0]))
        return ' '.join(result)

    @classmethod
    def seconds_to_day(cls, seconds: int, to_workday: bool = True):
        seconds_in_day = cls.DAY_IN_SECONDS if to_workday else PERIODS_IN_SECONDS['days']
        n_days = seconds // seconds_in_day
        difference_in_seconds = n_days * (cls.DAY_IN_SECONDS - PERIODS_IN_SECONDS['days'])
        seconds -= difference_in_seconds if to_workday else -difference_in_seconds
        return seconds

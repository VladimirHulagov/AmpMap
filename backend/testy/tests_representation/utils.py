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

from datetime import datetime
from itertools import groupby, product
from typing import Any, Dict, List, Tuple

from django.db.models import QuerySet
from django.utils import timezone
from tests_representation.choices import TestStatuses
from tests_representation.exceptions import DateRangeIsAbsent
from tests_representation.models import Parameter


def combination_parameters(parameters: List[Parameter]) -> List[Tuple[int, ...]]:
    """
    Returns all possible combinations of parameters by group name
    """
    group_parameters = {}

    for parameter in parameters:
        group_parameters.setdefault(parameter.group_name, []).append(parameter.id)

    return list(product(*group_parameters.values()))


class HistogramProcessor:
    def __init__(self, request_data: Dict[str, Any]) -> None:
        self.attribute = request_data.get('attribute', None)
        self.period = []
        for key in ('start_date', 'end_date'):
            value = request_data.get(key, None)
            if not value:
                raise DateRangeIsAbsent
            date = datetime.strptime(value, "%Y-%m-%d")
            if key == 'end_date':
                date += timezone.timedelta(days=1)
            self.period.append(
                timezone.make_aware(date)
            )

        self.all_dates = {
            self.period[0] + timezone.timedelta(days=n_day) for n_day in range(
                (self.period[1] - self.period[0]).days
            )
        }

    def fill_empty_points(self, result: List[Dict[str, Any]]):
        for unused_date in self.all_dates:
            item = {'point': unused_date.date()}
            item.update(
                {status.label.lower(): 0 for status in TestStatuses if status != TestStatuses.UNTESTED}
            )
            result.append(item)
        return result

    def group_by_date(self, instance):
        return instance.get('period_day', None)

    def group_by_attribute(self, instance):
        key_name = f'attributes__{self.attribute}'
        return instance.get(key_name, None)

    def process_statistic(self, test_results_formatted: QuerySet[Dict[str, Any]]) -> List[Dict[str, Any]]:
        group_func = self.group_by_attribute if self.attribute else self.group_by_date
        grouped_data = groupby(test_results_formatted, group_func)
        result = []

        for group_key, group_values in grouped_data:
            if not self.attribute:
                self.all_dates.remove(group_key)
            histogram_bar_data = {
                status.label.lower(): 0 for status in TestStatuses if status != TestStatuses.UNTESTED
            }
            histogram_bar_data.update({
                TestStatuses(obj['status']).label.lower(): obj['status_count'] for obj in group_values
            })
            histogram_bar_data['point'] = group_key.date() if not self.attribute else group_key
            result.append(histogram_bar_data)

        if not self.attribute:
            result = self.fill_empty_points(result)
        return sorted(result, key=lambda obj: str(obj['point']))

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
import operator
from datetime import datetime
from itertools import groupby
from typing import Any

from django.contrib.contenttypes.models import ContentType
from django.db.models import F, Func, OuterRef, Q, QuerySet, Subquery
from django.utils import timezone

from testy.core.models import LabeledItem
from testy.tests_description.models import TestCase
from testy.tests_representation.choices import TestStatuses
from testy.tests_representation.exceptions import DateRangeIsAbsent
from testy.tests_representation.models import Test, TestResult

_POINT = 'point'


class StatisticProcessor:
    def __init__(
        self,
        filter_condition: dict[str, Any],
        outer_ref_prefix: str | None = 'case',
    ):
        self.labels = filter_condition.get('labels') or []
        self.not_labels = filter_condition.get('not_labels') or []
        self.labels_condition = filter_condition.get('labels_condition')
        self.operation = operator.and_ if self.labels_condition == 'and' else operator.or_
        self.content_type_instance = ContentType.objects.get_for_model(TestCase)
        self.outer_ref_prefix = outer_ref_prefix

    @property
    def label_subquery(self) -> Subquery:
        outer_ref_lookup = f'{self.outer_ref_prefix}_id' if self.outer_ref_prefix else 'id'
        return Subquery(
            LabeledItem.objects.filter(
                object_id=OuterRef(outer_ref_lookup),
                label_id__in=self.labels,
                content_type=self.content_type_instance,
                is_deleted=False,
            ).order_by().annotate(
                count=Func(F('id'), function='Count'),
            ).values('count'),
        )

    @property
    def not_condition(self) -> Q:
        not_condition = Q()
        labeled_item_outer_ref = f'{self.outer_ref_prefix}__labeled_items' if self.outer_ref_prefix else 'labeled_items'
        for label in self.not_labels:
            condition_dict = {
                f'{labeled_item_outer_ref}__label_id': label,
                f'{labeled_item_outer_ref}__content_type': self.content_type_instance,
                f'{labeled_item_outer_ref}__is_deleted': False,
            }
            not_condition = self.operation(not_condition, ~Q(**condition_dict))
        return not_condition

    def process_labels(
        self,
        instances: QuerySet[Test | TestResult | TestCase],
    ) -> QuerySet[Test | TestResult | TestCase]:
        if self.labels_condition == 'and' and self.labels:
            having_condition = Q(label_count=len(self.labels))
        elif self.labels:
            having_condition = Q(label_count__gte=1)
        else:
            having_condition = Q()

        final_condition = self.operation(self.not_condition, having_condition)
        return instances.annotate(label_count=self.label_subquery).filter(final_condition)


class HistogramProcessor:
    def __init__(self, request_data: dict[str, Any]) -> None:
        self.attribute = request_data.get('attribute', None)
        self.period = []
        for key in ('start_date', 'end_date'):
            value = request_data.get(key, None)
            if not value:
                raise DateRangeIsAbsent
            date = datetime.strptime(value, '%Y-%m-%d')
            if key == 'end_date':
                date += timezone.timedelta(days=1)
            self.period.append(
                timezone.make_aware(date),
            )

        self.all_dates = {
            self.period[0] + timezone.timedelta(days=n_day) for n_day in range(
                (self.period[1] - self.period[0]).days,
            )
        }

    def fill_empty_points(self, result: list[dict[str, Any]]):
        for unused_date in self.all_dates:
            item = {_POINT: unused_date.date()}
            item.update(
                {status.label.lower(): 0 for status in TestStatuses if status != TestStatuses.UNTESTED},
            )
            result.append(item)
        return result

    def group_by_date(self, instance):
        return instance.get('period_day', None)

    def group_by_attribute(self, instance):
        key_name = f'attributes__{self.attribute}'
        return instance.get(key_name, None)

    def process_statistic(
        self,
        test_results_formatted: QuerySet[dict[str, Any]],
    ) -> list[dict[str, Any]]:
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
            histogram_bar_data[_POINT] = group_key if self.attribute else group_key.date()
            result.append(histogram_bar_data)

        if not self.attribute:
            result = self.fill_empty_points(result)

        if self.attribute and all(isinstance(obj[_POINT], int) for obj in result):
            return sorted(result, key=lambda obj: obj[_POINT])

        return sorted(result, key=lambda obj: str(obj[_POINT]))

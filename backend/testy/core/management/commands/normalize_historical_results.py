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
import logging
from datetime import timedelta
from typing import Optional

from django.core.management import BaseCommand
from django.db.models import F, OuterRef
from tests_representation.models import TestPlan, TestResult


class Command(BaseCommand):
    help = 'Fix history dates according to real results.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--project-id',
            action='store',
            help='Project that you want to fix',
            required=True,
            type=int,
        )
        parser.add_argument(
            '--timedelta',
            action='store',
            help='Timedelta in seconds that will consider history broken according to results.',
            required=True,
            type=int,
        )
        parser.add_argument(
            '--plan-id',
            action='store',
            help='Plan that you want to fix',
            required=False,
            type=int,
        )

    def handle(self, *args, **options) -> None:
        project_id = options.get('project_id')
        timedelta_seconds = options.get('timedelta')
        plan_id = options.get('plan_id')
        self.normalize_historical_results(project_id, timedelta_seconds, plan_id)

    @staticmethod
    def normalize_historical_results(project_id: int, timedelta_seconds: int, plan_id: Optional[int]) -> None:
        delta_time = timedelta(seconds=timedelta_seconds)
        filter_conditions = {'project__pk': project_id}
        if plan_id:
            plan_ids = TestPlan.objects.get(pk=plan_id).get_descendants(include_self=True).values_list('id', flat=True)
            filter_conditions['test__plan__id__in'] = plan_ids

        results = TestResult.objects.filter(**filter_conditions).values_list('id', flat=True)
        results_created_subquery = TestResult.objects.filter(pk=OuterRef('id')).values('created_at')[:1]
        results_updated_subquery = TestResult.objects.filter(pk=OuterRef('id')).values('updated_at')[:1]
        results_user_subquery = TestResult.objects.filter(pk=OuterRef('id')).values('user')[:1]
        results_created = (
            TestResult.history
            .filter(id__in=results, history_type='+')
            .annotate(time_diff=F('history_date') - results_created_subquery)
            .filter(time_diff__gt=delta_time)
            .prefetch_related('test', 'test__case')
        )
        results_updated = (
            TestResult.history
            .filter(id__in=results, history_type='~')
            .annotate(time_diff=F('history_date') - results_updated_subquery)
            .filter(time_diff__gt=delta_time)
            .prefetch_related('test', 'test__case')
        )
        logging.info(f'Found creation history diffed by {delta_time.seconds}: {len(results_created)}')
        logging.info(f'Found update history diffed by {delta_time.seconds}: {len(results_updated)}')
        logging.info('If you would like to proceed type UPDATE')
        if input() == 'UPDATE':
            results_created.update(history_date=results_created_subquery, history_user=results_user_subquery)
            results_updated.update(history_date=results_updated_subquery, history_user=results_user_subquery)

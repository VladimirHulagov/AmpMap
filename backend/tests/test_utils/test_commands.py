# TestY TMS - Test Management System
# Copyright (C) 2024 KNS Group LLC (YADRO)
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

import pytest
from django.core import management


@pytest.mark.django_db
class TestCommands:
    update_statistic_command = 'update_statistic'

    def test_update_statistics(self, project, test_plan_factory, test_suite_factory, test_factory, test_case_factory):
        plans_count = 3
        tests_count = 9
        cases_count = 5
        suites_count = 4
        cases = [test_case_factory(project=project) for _ in range(cases_count)]
        suites = [test_suite_factory(project=project) for _ in range(suites_count)]
        plans = [test_plan_factory(project=project) for _ in range(plans_count)]
        tests = [test_factory(project=project) for _ in range(tests_count)]
        statistic_fields = ('cases_count', 'suites_count', 'plans_count', 'tests_count')
        for statistic_field in statistic_fields:
            setattr(project.projectstatistics, statistic_field, -1)
        project.projectstatistics.save()
        management.call_command(self.update_statistic_command)
        project.refresh_from_db()
        assert project.projectstatistics.cases_count == len(cases), 'Wrong number of cases'
        assert project.projectstatistics.suites_count == len(suites), 'Wrong number of suites'
        assert project.projectstatistics.plans_count == len(plans), 'Wrong number of plans'
        assert project.projectstatistics.tests_count == len(tests), 'Wrong number of tests'

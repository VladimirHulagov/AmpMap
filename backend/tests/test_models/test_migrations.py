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

import pytest
from django.core.exceptions import ValidationError
from django.db.models import QuerySet
from django.utils import timezone
from mptt import register

pytestmark = pytest.mark.django_db


def test_changed_testplan_parameters_m2m(migrator):
    """Testing migrations 0011_added_testplan_parameters_m2m...0014_rename_parameters_m2m_testplan_parameters"""
    old_state = migrator.apply_initial_migration(
        ('tests_representation', '0010_added_updated_choices_to_tables'),
    )

    project_model = old_state.apps.get_model('core', 'Project')
    parameter_model = old_state.apps.get_model('tests_representation', 'Parameter')
    test_plan_model = old_state.apps.get_model('tests_representation', 'TestPlan')

    register(test_plan_model)

    project = project_model.objects.create(name='ProjectTest')
    parameters = parameter_model.objects.bulk_create([
        parameter_model(project=project, group_name='GroupTest1', data='Name1'),
        parameter_model(project=project, group_name='GroupTest2', data='Name2'),
    ])

    parameters_list_id = [p.id for p in parameters]

    test_plan = test_plan_model.objects.create(
        name="TestPlanTest",
        project=project,
        parameters=parameters_list_id,
        started_at=timezone.now(),
        due_date=timezone.now(),
    )

    assert isinstance(test_plan.parameters, list)
    assert test_plan.parameters == parameters_list_id

    new_state = migrator.apply_tested_migration(
        ('tests_representation', '0014_rename_parameters_m2m_testplan_parameters'),
    )
    test_plan_model = new_state.apps.get_model('tests_representation', 'TestPlan')
    new_test_plan = test_plan_model.objects.first()
    parameters_m2m = new_test_plan.parameters.all()

    assert isinstance(parameters_m2m, QuerySet)
    assert parameters_m2m[0].id == parameters[0].id
    assert parameters_m2m[1].id == parameters[1].id

    migrator.reset()


def test_changed_testplan_parameters_list(migrator):
    """
    Testing backwards migrations
    0011_added_testplan_parameters_m2m...0014_rename_parameters_m2m_testplan_parameters
    """
    old_state = migrator.apply_initial_migration(
        ('tests_representation', '0014_rename_parameters_m2m_testplan_parameters'),
    )

    project_model = old_state.apps.get_model('core', 'Project')
    parameter_model = old_state.apps.get_model('tests_representation', 'Parameter')
    test_plan_model = old_state.apps.get_model('tests_representation', 'TestPlan')

    register(test_plan_model)

    project = project_model.objects.create(name='ProjectTest')
    parameters = parameter_model.objects.bulk_create([
        parameter_model(project=project, group_name='GroupTest1', data='Name1'),
        parameter_model(project=project, group_name='GroupTest2', data='Name2'),
    ])

    test_plan = test_plan_model.objects.create(
        name="TestPlanTest",
        project=project,
        started_at=timezone.now(),
        due_date=timezone.now(),
    )

    test_plan.parameters.set(parameters)
    parameters_m2m = test_plan.parameters.all()

    assert isinstance(parameters_m2m, QuerySet)
    assert parameters_m2m[0].id == parameters[0].id
    assert parameters_m2m[1].id == parameters[1].id

    new_state = migrator.apply_tested_migration(
        ('tests_representation', '0010_added_updated_choices_to_tables'),
    )

    test_plan_model = new_state.apps.get_model('tests_representation', 'TestPlan')
    new_test_plan = test_plan_model.objects.first()
    parameters_list_id = [p.id for p in parameters]

    assert isinstance(new_test_plan.parameters, list)
    assert new_test_plan.parameters == parameters_list_id

    migrator.reset()


def test_username_caseinsesitive(migrator):
    old_state = migrator.apply_initial_migration(
        ('users', '0002_user_config'),
    )

    user_model = old_state.apps.get_model('users', 'User')

    for username in ['user', 'UsEr', 'USER']:
        user_model.objects.create(username=username, password='pass')

    new_state = migrator.apply_tested_migration(
        ('users', '0003_remove_ci_username_duplicates'),
    )

    user_model = new_state.apps.get_model('users', 'User')

    usernames = [user.username for user in user_model.objects.all()]
    assert len(usernames) == len({username.lower() for username in usernames})

    user = user_model(username='uSeR', password='pass')
    with pytest.raises(ValidationError):
        user.full_clean()

    migrator.reset()

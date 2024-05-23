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
from rest_framework.fields import SerializerMethodField
from rest_framework.reverse import reverse
from utilities.time import WorkTimeProcessor

from testy.core.api.v1.serializers import ProjectStatisticsSerializer
from testy.tests_description.api.v1.serializers import (
    TestCaseRetrieveSerializer,
    TestSuiteBaseSerializer,
    TestSuiteTreeSerializer,
)
from testy.tests_description.models import TestCase, TestSuite
from testy.tests_representation.api.v1.serializers import TestSerializer
from testy.tests_representation.models import Test, TestPlan


class TestMockSerializer(TestSerializer):
    suite_path = SerializerMethodField(read_only=True)
    test_suite_description = SerializerMethodField(read_only=True)
    estimate = SerializerMethodField()

    def get_suite_path(self, instance):
        return '/'.join([elem.name for elem in instance.case.suite.get_ancestors(include_self=True)])

    def get_test_suite_description(self, instance):
        return instance.case.suite.description

    def get_estimate(self, instance):
        if not instance.case.estimate:
            return None
        return WorkTimeProcessor.format_duration(instance.case.estimate)


class TestSuiteMockTreeSerializer(TestSuiteTreeSerializer):
    descendant_count = SerializerMethodField()

    class Meta:
        model = TestSuite
        fields = TestSuiteBaseSerializer.Meta.fields + (
            'children', 'title', 'descendant_count',
        )

    def get_descendant_count(self, instance):
        return instance.get_descendant_count()


class ProjectStatisticsMockSerializer(ProjectStatisticsSerializer):
    cases_count = SerializerMethodField()
    suites_count = SerializerMethodField()
    plans_count = SerializerMethodField()
    tests_count = SerializerMethodField()

    def get_icon(self, instance):
        if not instance.icon:
            return ''
        return self.context['request'].build_absolute_uri(
            reverse('api:v1:project-icon', kwargs={'pk': instance.id}),
        )

    @classmethod
    def get_cases_count(cls, instance):
        return TestCase.objects.filter(project=instance).count()

    @classmethod
    def get_suites_count(cls, instance):
        return TestSuite.objects.filter(project=instance).count()

    @classmethod
    def get_plans_count(cls, instance):
        return TestPlan.objects.filter(project=instance).count()

    @classmethod
    def get_tests_count(cls, instance):
        return Test.objects.filter(project=instance).count()


class TestCaseMockSerializer(TestCaseRetrieveSerializer):
    """Test case mock serializer to avoid prefetching in tests."""

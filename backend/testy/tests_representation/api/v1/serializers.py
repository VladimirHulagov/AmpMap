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
from rest_framework.fields import CharField, ChoiceField, DateTimeField, FloatField, IntegerField, SerializerMethodField
from rest_framework.relations import HyperlinkedIdentityField, PrimaryKeyRelatedField
from rest_framework.reverse import reverse
from rest_framework.serializers import ModelSerializer, Serializer

from testy.core.api.v1.serializers import AttachmentSerializer
from testy.core.selectors.attachments import AttachmentSelector
from testy.tests_description.api.v1.serializers import TestCaseLabelOutputSerializer, TestCaseListSerializer
from testy.tests_description.selectors.cases import TestCaseSelector
from testy.tests_representation.choices import TestStatuses
from testy.tests_representation.models import Parameter, Test, TestPlan, TestResult, TestStepResult
from testy.tests_representation.selectors.parameters import ParameterSelector
from testy.tests_representation.selectors.results import TestResultSelector
from testy.validators import DateRangeValidator, TestPlanParentValidator, TestResultUpdateValidator


class ParameterSerializer(ModelSerializer):
    url = HyperlinkedIdentityField(view_name='api:v1:parameter-detail')

    class Meta:
        model = Parameter
        fields = ('id', 'project', 'data', 'group_name', 'url')


class TestPlanUpdateSerializer(ModelSerializer):
    test_cases = PrimaryKeyRelatedField(queryset=TestCaseSelector().case_list(), many=True, required=False)

    class Meta:
        model = TestPlan
        fields = (
            'id', 'name', 'parent', 'test_cases', 'started_at', 'due_date', 'finished_at', 'is_archive', 'project',
            'description',
        )
        validators = [DateRangeValidator(), TestPlanParentValidator()]


class TestPlanInputSerializer(TestPlanUpdateSerializer):
    parameters = PrimaryKeyRelatedField(queryset=ParameterSelector().parameter_list(), many=True, required=False)

    class Meta(TestPlanUpdateSerializer.Meta):
        fields = TestPlanUpdateSerializer.Meta.fields + ('parameters',)


class TestSerializer(ModelSerializer):
    url = HyperlinkedIdentityField(view_name='api:v1:test-detail')
    name = SerializerMethodField(read_only=True)
    last_status = SerializerMethodField(read_only=True)
    suite = SerializerMethodField(read_only=True)
    labels = SerializerMethodField()
    suite_path = CharField(read_only=True)
    assignee_username = SerializerMethodField(read_only=True)
    avatar_link = SerializerMethodField(read_only=True)
    test_suite_description = CharField(read_only=True)

    class Meta:
        model = Test
        fields = (
            'id', 'project', 'case', 'suite', 'name', 'last_status', 'plan', 'assignee',
            'assignee_username', 'is_archive', 'created_at', 'updated_at', 'url', 'labels', 'suite_path', 'avatar_link',
            'test_suite_description',
        )
        read_only_fields = ('project',)

    def get_assignee_username(self, instance):
        if instance.assignee:
            return instance.assignee.username

    def get_name(self, instance):
        return instance.case.name

    def get_last_status(self, instance):
        if getattr(instance, 'last_status', None) is not None:
            return TestStatuses(instance.last_status).label

    def get_labels(self, instance):
        return TestCaseLabelOutputSerializer(instance.case.labeled_items.all(), many=True).data

    @classmethod
    def get_suite(cls, instance):
        return instance.case.suite.id

    def get_avatar_link(self, instance):
        if not instance.assignee:
            return ''
        if not instance.assignee.avatar:
            return ''
        return self.context['request'].build_absolute_uri(
            reverse('avatar-path', kwargs={'pk': instance.assignee.id}),
        )


class TestStepResultSerializer(ModelSerializer):
    id = IntegerField(required=False)
    name = SerializerMethodField()
    sort_order = SerializerMethodField()

    class Meta:
        model = TestStepResult
        fields = ('id', 'step', 'name', 'status', 'sort_order')

    def get_name(self, instance):
        step = instance.step.history.get(test_case_history_id=instance.test_result.test_case_version).instance
        return step.name

    def get_sort_order(self, instance):
        step = instance.step.history.get(test_case_history_id=instance.test_result.test_case_version).instance
        return step.sort_order


class TestResultSerializer(ModelSerializer):
    url = HyperlinkedIdentityField(view_name='api:v1:testresult-detail')
    status_text = CharField(source='get_status_display', read_only=True)
    user_full_name = SerializerMethodField(read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    steps_results = TestStepResultSerializer(many=True, required=False)
    avatar_link = SerializerMethodField(read_only=True)
    latest = SerializerMethodField()

    class Meta:
        model = TestResult
        fields = (
            'id', 'project', 'status', 'status_text', 'test', 'user', 'user_full_name', 'comment', 'avatar_link',
            'is_archive', 'test_case_version', 'created_at', 'updated_at', 'url', 'execution_time', 'attachments',
            'attributes', 'steps_results', 'latest',
        )

        read_only_fields = ('test_case_version', 'project', 'user', 'id')

    def get_avatar_link(self, instance):
        if not instance.user:
            return ''
        if not instance.user.avatar:
            return ''
        return self.context['request'].build_absolute_uri(
            reverse('avatar-path', kwargs={'pk': instance.user.id}),
        )

    def get_user_full_name(self, instance):
        if instance.user:
            return instance.user.get_full_name()

    def get_latest(self, instance):
        if not hasattr(instance, 'latest_result_id'):
            return None
        return instance.id == instance.latest_result_id


class TestResultActivitySerializer(ModelSerializer):
    status_text = CharField(source='get_status_display', read_only=True)
    action = SerializerMethodField()
    plan_id = SerializerMethodField()
    test_id = IntegerField()
    test_name = SerializerMethodField()
    action_day = DateTimeField()
    action_timestamp = DateTimeField(source='history_date')
    username = SerializerMethodField()
    avatar_link = SerializerMethodField(read_only=True)

    class Meta:
        model = TestResult
        fields = (
            'id', 'status_text', 'username', 'action', 'plan_id', 'test_id', 'test_name', 'action_day',
            'action_timestamp', 'avatar_link',
        )

    @classmethod
    def get_test_name(cls, instance):
        return instance.test.case.name

    @classmethod
    def get_username(cls, instance):
        if instance.history_user:
            return instance.history_user.username
        return None

    @classmethod
    def get_action(cls, instance):
        if instance.history_type == '+':
            return 'added'
        elif instance.history_type == '-':
            return 'deleted'
        elif instance.history_type == '~':
            return 'updated'
        return 'unknown'

    @classmethod
    def get_plan_id(cls, instance):
        return instance.test.plan.id

    @classmethod
    def get_project(cls, instance):
        return instance.project.id

    @classmethod
    def get_project_title(cls, instance):
        return instance.project.name

    def get_avatar_link(self, instance):
        if not instance.history_user:
            return ''
        if not instance.history_user.avatar:
            return ''
        return self.context['request'].build_absolute_uri(
            reverse('avatar-path', kwargs={'pk': instance.history_user.id}),
        )


class TestResultInputSerializer(TestResultSerializer):
    attachments = PrimaryKeyRelatedField(
        many=True, queryset=AttachmentSelector().attachment_list(), required=False,
    )

    class Meta(TestResultSerializer.Meta):
        validators = [
            TestResultUpdateValidator(
                time_limited_fields=[
                    'project', 'status', 'test', 'execution_time', 'attachments', 'attributes',
                    'steps_results',
                ],
            ),
        ]


class ParentPlanSerializer(ModelSerializer):
    class Meta:
        model = TestPlan
        fields = ('id', 'name')


class TestPlanTestResultSerializer(ModelSerializer):
    status = SerializerMethodField()
    updated_at = SerializerMethodField()

    class Meta:
        model = TestResult
        fields = (
            'id', 'status', 'comment', 'test_case_version', 'created_at', 'updated_at',
        )

    def get_status(self, instance):
        return instance.get_status_display()

    def get_updated_at(self, instance):
        return instance.updated_at.strftime('%d.%m.%Y %H:%M:%S')


class TestPlanTestSerializer(ModelSerializer):
    case = TestCaseListSerializer()
    current_result = SerializerMethodField()
    test_results = TestPlanTestResultSerializer(many=True, read_only=True)

    def get_test_results(self, instance):
        return TestResultSelector().result_list_by_test_id(instance.id)

    class Meta:
        model = Test
        fields = (
            'id', 'case', 'plan', 'is_archive', 'created_at', 'updated_at', 'test_results',
            'current_result',
        )

    def get_current_result(self, instance):
        if instance.test_results.last():
            return instance.test_results.last().get_status_display()
        return None


class TestPlanOutputSerializer(ModelSerializer):
    url = HyperlinkedIdentityField(view_name='api:v1:testplan-detail')
    title = SerializerMethodField()

    class Meta:
        model = TestPlan
        fields = (
            'id', 'name', 'parent',
            'parameters',
            'started_at', 'due_date', 'finished_at', 'is_archive',
            'project',
            'child_test_plans',
            'url', 'title', 'description',
        )

    @classmethod
    def get_title(cls, instance: TestPlan):
        if parameters := instance.parameters.all():
            return '{0} [{1}]'.format(instance.name, ', '.join([parameter.data for parameter in parameters]))
        return instance.name


class TestPlanTreeSerializer(TestPlanOutputSerializer):
    children = SerializerMethodField()
    parent = ParentPlanSerializer()

    class Meta:
        model = TestPlan
        fields = TestPlanOutputSerializer.Meta.fields + ('children',)

    def get_children(self, value):
        return self.__class__(value.child_test_plans.all(), many=True, context=self.context).data


class TestPlanStatisticsSerializer(Serializer):
    label = ChoiceField(
        choices=[label.upper() for label in TestStatuses.labels],
    )
    value = IntegerField()
    estimates = FloatField()


class TestPlanProgressSerializer(Serializer):
    id = IntegerField()
    title = SerializerMethodField()
    tests_total = IntegerField()
    tests_progress_period = IntegerField()
    tests_progress_total = IntegerField()

    @classmethod
    def get_title(cls, instance: TestPlan):
        if parameters := instance.parameters.all():
            return '{0} [{1}]'.format(instance.name, ', '.join([parameter.data for parameter in parameters]))
        return instance.name

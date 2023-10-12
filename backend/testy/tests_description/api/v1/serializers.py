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

from core.api.v1.serializers import AttachmentSerializer
from core.models import Label, LabeledItem
from core.selectors.attachments import AttachmentSelector
from core.selectors.projects import ProjectSelector
from rest_framework import serializers
from rest_framework.fields import BooleanField, IntegerField, SerializerMethodField, empty
from rest_framework.relations import HyperlinkedIdentityField, PrimaryKeyRelatedField
from rest_framework.serializers import ModelSerializer
from serializer_fields import EstimateField
from tests_description.models import TestCase, TestCaseStep, TestSuite
from tests_description.selectors.suites import TestSuiteSelector
from validators import EstimateValidator


class TestCaseStepBaseSerializer(ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = TestCaseStep
        fields = ('id', 'name', 'scenario', 'expected', 'sort_order')


class TestCaseStepInputSerializer(TestCaseStepBaseSerializer):
    attachments = PrimaryKeyRelatedField(
        many=True, queryset=AttachmentSelector().attachment_list(), required=False
    )

    class Meta(TestCaseStepBaseSerializer.Meta):
        fields = TestCaseStepBaseSerializer.Meta.fields + ('attachments',)


class TestCaseStepOutputSerializer(TestCaseStepBaseSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta(TestCaseStepBaseSerializer.Meta):
        fields = TestCaseStepBaseSerializer.Meta.fields + ('attachments',)


class TestCaseBaseSerializer(ModelSerializer):
    estimate = EstimateField(allow_null=True, required=False)

    class Meta:
        model = TestCase
        fields = ('id', 'name', 'project', 'suite', 'setup', 'scenario', 'expected',
                  'teardown', 'estimate', 'description', 'is_steps')

    validators = [EstimateValidator()]


class TestCaseLabelOutputSerializer(ModelSerializer):
    id = serializers.IntegerField(source='label.id')
    name = serializers.CharField(source='label.name')

    class Meta:
        model = LabeledItem
        fields = ('id', 'name',)


class TestCaseLabelInputSerializer(ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Label
        fields = ('id', 'name')


class TestCaseInputBaseSerializer(TestCaseBaseSerializer):
    attachments = PrimaryKeyRelatedField(
        many=True, queryset=AttachmentSelector().attachment_list(), required=False
    )
    labels = TestCaseLabelInputSerializer(many=True, required=False)

    class Meta(TestCaseBaseSerializer.Meta):
        fields = TestCaseBaseSerializer.Meta.fields + ('attachments', 'labels',)


class TestCaseInputSerializer(TestCaseInputBaseSerializer):
    scenario = serializers.CharField(required=True)


class TestCaseInputWithStepsSerializer(TestCaseInputBaseSerializer):
    scenario = serializers.CharField(allow_blank=True, required=False)
    steps = TestCaseStepInputSerializer(many=True, required=True)

    class Meta(TestCaseInputBaseSerializer.Meta):
        fields = TestCaseInputBaseSerializer.Meta.fields + ('steps',)

    def validate_steps(self, value):
        if len(value) == 0:
            raise serializers.ValidationError('At least one step required')
        return value


class TestCaseSerializer(TestCaseBaseSerializer):
    steps = SerializerMethodField()
    url = HyperlinkedIdentityField(view_name='api:v1:testcase-detail')
    key = IntegerField(source='id', read_only=True)
    value = IntegerField(source='id', read_only=True)
    attachments = PrimaryKeyRelatedField(
        many=True, queryset=AttachmentSelector().attachment_list(), required=False
    )
    labels = SerializerMethodField()

    class Meta(TestCaseBaseSerializer.Meta):
        fields = TestCaseBaseSerializer.Meta.fields + ('key', 'value', 'attachments', 'url', 'steps', 'labels')

    def get_steps(self, instance):
        return TestCaseStepOutputSerializer(instance.steps.all(), many=True, context=self.context).data

    def get_labels(self, instance):
        return TestCaseLabelOutputSerializer(instance.labeled_items.all(), many=True).data


class TestCaseTreeSerializer(ModelSerializer):
    class Meta:
        model = TestCase
        fields = ('id', 'name')


class TestCaseRetrieveSerializer(TestCaseBaseSerializer):
    steps = SerializerMethodField()
    url = HyperlinkedIdentityField(view_name='api:v1:testcase-detail')
    attachments = AttachmentSerializer(many=True, read_only=True)
    labels = SerializerMethodField()
    versions = SerializerMethodField()
    current_version = SerializerMethodField()

    def __init__(self, instance=None, version=None, data=empty, **kwargs):
        self._version = version
        super().__init__(instance, data, **kwargs)

    class Meta:
        model = TestCase
        fields = (
            'id',
            'name',
            'project',
            'attachments',
            'suite',
            'setup',
            'scenario',
            'expected',
            'teardown',
            'estimate',
            'url',
            'versions',
            'current_version',
            'description',
            'is_steps',
            'steps',
            'labels',
        )

    def get_labels(self, instance):
        if self._version is not None:
            labels = LabeledItem.history.filter(content_object_history_id=self._version).as_instances()
        else:
            labels = instance.labeled_items.all()
        return TestCaseLabelOutputSerializer(labels, many=True, context=self.context).data

    def get_versions(self, instance):
        return instance.history.values_list('history_id', flat=True).all()

    def get_current_version(self, instance):
        if self._version is not None:
            return self._version
        return instance.history.first().history_id

    def get_steps(self, instance):
        if self._version is not None:
            steps = TestCaseStep.history.filter(test_case_history_id=self._version).as_instances()
        else:
            steps = instance.steps.all()
        return TestCaseStepOutputSerializer(steps, many=True, context=self.context).data


class TestSuiteBaseSerializer(ModelSerializer):
    url = HyperlinkedIdentityField(view_name='api:v1:testsuite-detail')

    class Meta:
        model = TestSuite
        fields = ('id', 'name', 'parent', 'project', 'url', 'description')


class TestSuiteSerializer(TestSuiteBaseSerializer):
    test_cases = TestCaseSerializer(many=True, read_only=True)

    class Meta:
        model = TestSuite
        fields = TestSuiteBaseSerializer.Meta.fields + ('test_cases',)


class TestSuiteTreeSerializer(TestSuiteBaseSerializer):
    children = SerializerMethodField()
    key = serializers.IntegerField(source='id')
    value = serializers.IntegerField(source='id')
    title = serializers.CharField(source='name')
    descendant_count = IntegerField()
    cases_count = IntegerField()

    class Meta:
        model = TestSuite
        fields = TestSuiteBaseSerializer.Meta.fields + (
            'children', 'key', 'value', 'title', 'descendant_count', 'cases_count'
        )

    def get_children(self, value):
        return self.__class__(value.child_test_suites.all(), many=True, context=self.context).data


class TestSuiteTreeBreadcrumbsSerializer(TestSuiteTreeSerializer):
    is_used = BooleanField()

    class Meta:
        model = TestSuite
        fields = ('id', 'title', 'children', 'is_used')


class TestSuiteTreeCasesSerializer(TestSuiteTreeSerializer):
    test_cases = TestCaseTreeSerializer(many=True, read_only=True)

    class Meta:
        model = TestSuite
        fields = TestSuiteTreeSerializer.Meta.fields + ('test_cases',)


class TestSuiteCopyDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    new_name = serializers.CharField(required=False)


class TestCaseCopySerializer(serializers.Serializer):
    cases = TestSuiteCopyDetailSerializer(many=True, required=True)
    dst_suite_id = serializers.IntegerField(required=False)


class TestSuiteCopyDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    new_name = serializers.CharField(required=False)


class TestSuiteCopySerializer(serializers.Serializer):
    suites = TestSuiteCopyDetailSerializer(many=True, required=True)
    dst_project_id = serializers.PrimaryKeyRelatedField(
        required=False,
        allow_null=True,
        queryset=ProjectSelector.project_list()
    )
    dst_suite_id = serializers.PrimaryKeyRelatedField(
        queryset=TestSuiteSelector.suite_list_raw(),
        required=False,
        allow_null=True
    )

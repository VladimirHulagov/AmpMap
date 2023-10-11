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
import factory
from comments.models import Comment
from core.models import Attachment, Label, LabeledItem, Project, SystemMessage
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib.contenttypes.models import ContentType
from factory import Sequence, SubFactory
from factory.django import DjangoModelFactory
from tests_description.models import TestCase, TestCaseStep, TestSuite
from tests_representation.choices import TestStatuses
from tests_representation.models import Parameter, Test, TestPlan, TestResult
from users.models import Group

import tests.constants as constants

UserModel = get_user_model()


class ProjectFactory(DjangoModelFactory):
    class Meta:
        model = Project

    name = Sequence(lambda n: f'{constants.PROJECT_NAME}{n}')
    description = constants.DESCRIPTION


class ParameterFactory(DjangoModelFactory):
    class Meta:
        model = Parameter

    project = SubFactory(ProjectFactory)
    data = Sequence(lambda n: f'{constants.PARAMETER_DATA}{n}')
    group_name = Sequence(lambda n: f'{constants.PARAMETER_GROUP_NAME}{n}')


class UserFactory(DjangoModelFactory):
    class Meta:
        model = UserModel

    username = Sequence(lambda n: f'{constants.USERNAME}{n}@yadro.com')
    first_name = constants.FIRST_NAME
    last_name = constants.LAST_NAME
    password = make_password(constants.PASSWORD)
    email = username
    is_active = True
    is_staff = False


class GroupFactory(DjangoModelFactory):
    class Meta:
        model = Group

    name = Sequence(lambda n: f'{constants.GROUP_NAME}{n}')


class LabelFactory(DjangoModelFactory):
    class Meta:
        model = Label

    name = Sequence(lambda n: f'{constants.LABEL_NAME}{n}')
    project = SubFactory(ProjectFactory)
    user = SubFactory(UserFactory)
    type = constants.LABEL_TYPE_SYSTEM


class LabeledItemFactory(DjangoModelFactory):
    label = SubFactory(LabelFactory)

    class Meta:
        model = LabeledItem


class TestPlanFactory(DjangoModelFactory):
    class Meta:
        model = TestPlan

    name = Sequence(lambda n: f'{constants.TEST_PLAN_NAME}{n}')
    started_at = constants.DATE
    due_date = constants.DATE
    finished_at = constants.DATE
    project = SubFactory(ProjectFactory)
    is_archive = False
    description = constants.DESCRIPTION


class TestPlanWithParametersFactory(TestPlanFactory):
    @factory.post_generation
    def parameters(self, create, extracted, **kwargs):
        if extracted:
            self.parameters.add(*extracted)
            return
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            self.parameters.add(ParameterFactory(project=self.project))


class TestResultsFactory(DjangoModelFactory):
    class Meta:
        model = TestResult


class TestSuiteFactory(DjangoModelFactory):
    class Meta:
        model = TestSuite

    name = Sequence(lambda n: f'{constants.TEST_SUITE_NAME}{n}')
    project = SubFactory(ProjectFactory)
    description = Sequence(lambda n: f'{constants.DESCRIPTION}{n}')


class TestCaseFactory(DjangoModelFactory):
    class Meta:
        model = TestCase

    name = Sequence(lambda n: f'{constants.TEST_CASE_NAME}{n}')
    project = SubFactory(ProjectFactory)
    suite = SubFactory(TestSuiteFactory)
    setup = constants.SETUP
    scenario = constants.SCENARIO
    teardown = constants.TEARDOWN
    estimate = constants.ESTIMATE
    description = constants.DESCRIPTION
    expected = constants.EXPECTED


class TestCaseStepFactory(DjangoModelFactory):
    class Meta:
        model = TestCaseStep

    project = SubFactory(ProjectFactory)
    name = Sequence(lambda n: f'{constants.TEST_CASE_NAME}{n}')
    scenario = Sequence(lambda n: f'{constants.SCENARIO}{n}')


class TestCaseWithStepsFactory(DjangoModelFactory):
    class Meta:
        model = TestCase

    name = Sequence(lambda n: f'{constants.TEST_CASE_NAME}{n}')
    project = SubFactory(ProjectFactory)
    suite = SubFactory(TestSuiteFactory)
    setup = constants.SETUP
    scenario = constants.SCENARIO
    teardown = constants.TEARDOWN
    estimate = constants.ESTIMATE
    description = constants.DESCRIPTION
    is_steps = True

    @factory.post_generation
    def steps(self, create, extracted, **kwargs):
        if extracted:
            self.steps.add(*extracted)
        for _ in range(constants.NUMBER_OF_OBJECTS_TO_CREATE):
            self.steps.add(TestCaseStepFactory(project=self.project))


class TestFactory(DjangoModelFactory):
    class Meta:
        model = Test

    case = SubFactory(TestCaseFactory)
    plan = SubFactory(TestPlanFactory)
    assignee = SubFactory(UserFactory)
    project = SubFactory(ProjectFactory)
    is_archive = False


class TestResultFactory(DjangoModelFactory):
    class Meta:
        model = TestResult

    test = SubFactory(TestFactory)
    status = TestStatuses.UNTESTED
    comment = constants.TEST_COMMENT
    project = SubFactory(ProjectFactory)
    execution_time = constants.EXECUTION_TIME
    user = SubFactory(UserFactory)
    test_case_version = 1

    @classmethod
    def _create(cls, target_class, *args, **kwargs):
        created_at = kwargs.pop('created_at', None)
        obj = super(TestResultFactory, cls)._create(target_class, *args, **kwargs)
        if created_at is not None:
            obj.created_at = created_at
            obj.save()
        return obj


class CommentBaseFactory(DjangoModelFactory):
    content = Sequence(lambda n: f'{constants.TEST_COMMENT}{n}')
    user = SubFactory(UserFactory)
    object_id = factory.SelfAttribute('content_object.id')
    content_type = factory.LazyAttribute(lambda o: ContentType.objects.get_for_model(o.content_object))

    class Meta:
        exclude = ['content_object']
        abstract = True


class CommentTestFactory(CommentBaseFactory):
    content_object = factory.SubFactory(TestFactory)

    class Meta:
        model = Comment


class CommentTestPlanFactory(CommentBaseFactory):
    content_object = factory.SubFactory(TestPlanFactory)

    class Meta:
        model = Comment


class CommentTestResultFactory(CommentBaseFactory):
    content_object = factory.SubFactory(TestResultFactory)

    class Meta:
        model = Comment


class CommentTestSuiteFactory(CommentBaseFactory):
    content_object = factory.SubFactory(TestSuiteFactory)

    class Meta:
        model = Comment


class CommentTestCaseFactory(CommentBaseFactory):
    content_object = factory.SubFactory(TestCaseFactory)

    class Meta:
        model = Comment


class AttachmentBaseFactory(DjangoModelFactory):
    class Meta:
        exclude = ['content_object']
        abstract = True

    project = SubFactory(ProjectFactory)
    name = Sequence(lambda n: f'{constants.ATTACHMENT_NAME}{n}')
    filename = constants.FILE_NAME
    file_extension = constants.FILE_EXTENSION
    size = constants.FILE_SIZE
    object_id = factory.SelfAttribute('content_object.id')
    content_type = factory.LazyAttribute(lambda o: ContentType.objects.get_for_model(o.content_object))
    file = factory.django.FileField(data=b'SomeText', content_type='text/plain')
    user = SubFactory(UserFactory)


class AttachmentFactory(AttachmentBaseFactory):
    class Meta:
        model = Attachment


class AttachmentTestCaseFactory(AttachmentBaseFactory):
    content_object = factory.SubFactory(TestCaseFactory)

    class Meta:
        model = Attachment


class AttachmentTestResultFactory(AttachmentBaseFactory):
    content_object = factory.SubFactory(TestResultFactory)

    class Meta:
        model = Attachment


class AttachmentCommentFactory(AttachmentBaseFactory):
    content_object = factory.SubFactory(CommentTestFactory)

    class Meta:
        model = Attachment


class SystemMessageFactory(DjangoModelFactory):
    content = Sequence(lambda n: f'{constants.SYSTEM_MESSAGE}{n}')
    level = constants.SYSTEM_MESSAGE_TYPE
    is_active = False

    class Meta:
        model = SystemMessage

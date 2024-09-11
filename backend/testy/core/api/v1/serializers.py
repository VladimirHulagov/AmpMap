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

import humanize
import timeago
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from django.utils import timezone
from notifications.models import Notification
from rest_framework.exceptions import ValidationError
from rest_framework.fields import (
    BooleanField,
    CharField,
    DateTimeField,
    IntegerField,
    JSONField,
    ListField,
    SerializerMethodField,
)
from rest_framework.relations import PrimaryKeyRelatedField
from rest_framework.serializers import HyperlinkedIdentityField, ModelSerializer, Serializer

from testy.core.constants import CUSTOM_ATTRIBUTES_ALLOWED_APPS, CUSTOM_ATTRIBUTES_ALLOWED_MODELS
from testy.core.models import Attachment, CustomAttribute, Label, NotificationSetting, Project, SystemMessage
from testy.core.selectors.notifications import NotificationSelector
from testy.core.selectors.project_settings import ProjectSettings
from testy.core.validators import CustomAttributeCreateValidator, ProjectStatusOrderValidator
from testy.serializer_fields import EstimateField


class LabelSerializer(ModelSerializer):
    url = HyperlinkedIdentityField(view_name='api:v1:label-detail')
    username = SerializerMethodField()

    class Meta:
        model = Label
        fields = ('id', 'url', 'name', 'username', 'type', 'user', 'project')

    def get_username(self, instance) -> str | None:
        if instance.user is not None:
            return instance.user.username
        return None


class CustomAttributeBaseSerializer(ModelSerializer):
    url = HyperlinkedIdentityField(view_name='api:v1:customattribute-detail')

    class Meta:
        model = CustomAttribute
        fields = (
            'id',
            'url',
            'project',
            'name',
            'is_required',
            'is_suite_specific',
            'type',
            'is_deleted',
            'suite_ids',
            'status_specific',
        )


class CustomAttributeInputSerializer(CustomAttributeBaseSerializer):
    content_types = PrimaryKeyRelatedField(
        queryset=ContentType.objects.filter(
            app_label__in=CUSTOM_ATTRIBUTES_ALLOWED_APPS,
            model__in=CUSTOM_ATTRIBUTES_ALLOWED_MODELS,
        ),
        many=True, allow_empty=False,
    )

    class Meta:
        model = CustomAttribute
        fields = CustomAttributeBaseSerializer.Meta.fields + ('content_types',)

        validators = [CustomAttributeCreateValidator()]


class CustomAttributeOutputSerializer(CustomAttributeBaseSerializer):
    class Meta:
        model = CustomAttribute
        fields = CustomAttributeBaseSerializer.Meta.fields + ('content_types',)


class ContentTypeSerializer(ModelSerializer):
    class Meta:
        model = ContentType
        fields = ['id', 'app_label', 'model']


class ProjectSettingsSerializer(Serializer):
    is_result_editable = BooleanField(
        allow_null=False,
        default=ProjectSettings().is_result_editable,
    )
    result_edit_limit = EstimateField(
        allow_null=True,
        default=ProjectSettings().result_edit_limit,
        to_workday=False,
    )
    status_order = JSONField(
        default=dict,
        validators=[ProjectStatusOrderValidator()],
    )


class ProjectSerializer(ModelSerializer):
    url = HyperlinkedIdentityField(view_name='api:v1:project-detail')
    settings = ProjectSettingsSerializer(required=False)

    class Meta:
        model = Project
        fields = ('id', 'url', 'name', 'description', 'is_archive', 'icon', 'settings', 'is_private')


class ProjectRetrieveSerializer(ProjectSerializer):
    url = HyperlinkedIdentityField(view_name='api:v1:project-detail')
    icon = SerializerMethodField(read_only=True)
    is_manageable = BooleanField(read_only=True)

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ('is_manageable',)

    def get_icon(self, instance):
        if not instance.icon:
            return ''
        return self.context['request'].build_absolute_uri(
            reverse('api:v1:project-icon', kwargs={'pk': instance.id}),
        )


class ProjectStatisticsSerializer(ProjectRetrieveSerializer):
    url = HyperlinkedIdentityField(view_name='api:v1:project-detail')
    is_visible = BooleanField(read_only=True)
    cases_count = IntegerField()
    suites_count = IntegerField()
    plans_count = IntegerField()
    tests_count = IntegerField()

    class Meta:
        model = Project
        fields = ProjectRetrieveSerializer.Meta.fields + (
            'cases_count', 'suites_count', 'plans_count', 'tests_count', 'is_visible',
        )


class AllProjectsStatisticSerializer(Serializer):
    projects_count = IntegerField()
    cases_count = IntegerField()
    suites_count = IntegerField()
    plans_count = IntegerField()
    tests_count = IntegerField()


class RecoveryInputSerializer(Serializer):
    instance_ids = ListField()


class AttachmentSerializer(ModelSerializer):
    url = HyperlinkedIdentityField(view_name='api:v1:attachment-detail')
    size_humanize = SerializerMethodField()
    link = SerializerMethodField(read_only=True)

    class Meta:
        model = Attachment
        fields = (
            'id', 'project', 'comment', 'name', 'filename', 'file_extension', 'size', 'size_humanize', 'content_type',
            'object_id', 'user', 'file', 'url', 'link',
        )

        read_only_fields = ('name', 'filename', 'file_extension', 'size', 'user', 'url')
        extra_kwargs = {'file': {'write_only': True}}

    def get_size_humanize(self, instance):
        return humanize.naturalsize(instance.size)

    def get_link(self, instance):
        return self.context['request'].build_absolute_uri(
            reverse('attachment-path', kwargs={'pk': instance.id}),
        )

    def validate(self, attrs):
        content_type = attrs.get('content_type')
        object_id = attrs.get('object_id')

        if content_type is None:
            return attrs

        if not content_type.model_class().objects.all().filter(pk=object_id):
            raise ValidationError(f'Specified model does not have object with id {object_id}')

        return attrs


class SystemMessageSerializer(ModelSerializer):
    class Meta:
        model = SystemMessage
        fields = ('id', 'created_at', 'updated_at', 'content', 'level', 'is_closing')


class CopyDetailSerializer(Serializer):
    id = IntegerField(required=True)
    new_name = CharField(required=False)


class AccessRequestSerializer(Serializer):
    reason = CharField(required=False, allow_blank=True, allow_null=True)


class NotificationSerializer(ModelSerializer):
    actor = CharField(source='actor.username', read_only=True)
    timeago = SerializerMethodField()
    timestamp = DateTimeField(read_only=True)
    message = SerializerMethodField()

    @classmethod
    def get_message(cls, instance: Notification):
        return instance.data

    @classmethod
    def get_timeago(cls, instance: Notification):
        return timeago.format(timezone.now() - instance.timestamp)

    class Meta:
        model = Notification
        fields = (
            'id',
            'unread',
            'actor',
            'timestamp',
            'timeago',
            'message',
        )


class NotificationSettingSerializer(ModelSerializer):
    enabled = BooleanField(read_only=True)

    class Meta:
        model = NotificationSetting
        fields = ('action_code', 'verbose_name', 'enabled')


class ModifyNotificationsSettingsSerializer(Serializer):
    settings = PrimaryKeyRelatedField(
        queryset=NotificationSelector.list_notification_settings(),
        many=True,
        required=True,
    )


class MarkNotificationSerializer(Serializer):
    unread = BooleanField(default=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if (request := self.context.get('request')) and request.user:
            self.fields['notifications'] = PrimaryKeyRelatedField(
                many=True,
                queryset=NotificationSelector.list_notifications(request.user),
                allow_empty=True,
            )

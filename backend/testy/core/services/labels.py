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
from copy import deepcopy
from itertools import chain
from typing import Any, TypeVar

from django.contrib.contenttypes.models import ContentType
from django.db.models import Model, Q, QuerySet
from django.db.models.functions import Lower
from django.utils import timezone
from simple_history.utils import bulk_create_with_history, get_history_manager_for_model

from testy.core.choices import LabelTypes
from testy.core.models import Label, LabeledItem, Project
from testy.core.selectors.labels import LabelSelector
from testy.users.models import User

_MT = TypeVar('_MT', bound=Model)
_ID = 'id'
_NAME = 'name'


class LabelService:
    non_side_effect_fields = [_NAME, 'user', 'project', 'type']

    @classmethod
    def label_create(cls, data: dict[str, Any], commit: bool = True) -> Label:
        return Label.model_create(
            fields=cls.non_side_effect_fields,
            data=data,
            commit=commit,
        )

    @classmethod
    def label_update(cls, label: Label, data: dict[str, Any]) -> Label:
        label, _ = label.model_update(
            fields=cls.non_side_effect_fields,
            data=data,
        )
        return label

    @classmethod
    def set(
        cls,
        labels: list[dict[str, Any]],
        content_object: _MT,
        user: User,
    ):
        content_type = ContentType.objects.get_for_model(content_object)
        lookup_kwargs = {
            'object_id': content_object.id,
            'content_type': content_type,
        }
        cls.clear(lookup_kwargs)
        cls.add_labels_to_objects(
            labels=labels,
            content_objects=[content_object],
            content_type=content_type,
            project=content_object.project,
            user=user,
        )

    @classmethod
    def bulk_add(
        cls,
        labels: list[dict[str, Any]],
        content_objects: list[_MT],
        content_model: type[_MT],
        project: Project,
        user: User,
    ):
        content_type = ContentType.objects.get_for_model(content_model)
        cls._force_create_history(content_objects, user, content_model)
        cls.add_labels_to_objects(labels, content_objects, content_type, project, user, is_recreate_existed=True)

    @classmethod
    def bulk_set(
        cls,
        labels: list[dict[str, Any]],
        content_objects: list[_MT],
        content_model: type[_MT],
        project: Project,
        user: User,
    ):
        content_type = ContentType.objects.get_for_model(content_model)
        lookup_kwargs = {
            'object_id__in': [content_object.id for content_object in content_objects],
            'content_type': content_type,
        }
        cls._force_create_history(content_objects, user, content_model)
        cls.clear(lookup_kwargs)
        cls.add_labels_to_objects(labels, content_objects, content_type, project, user)

    @classmethod
    def bulk_delete(
        cls,
        labels: list[dict[str, Any]],
        content_model: type[_MT],
        content_objects: list[_MT],
        user: User,
    ):
        content_type = ContentType.objects.get_for_model(content_model)
        cls._force_create_history(content_objects, user, content_model)
        label_ids = [label['id'] for label in labels if label.get('id')]
        lookup_kwargs = {
            'object_id__in': [content_object.id for content_object in content_objects],
            'content_type': content_type,
        }
        labeled_items_for_restore = []
        for content_object in content_objects:
            content_object_history_id = (
                content_object.history.first().history_id if hasattr(content_object, 'history') else None
            )
            labeled_items = (
                content_object
                .labeled_items
                .select_related('label')
                .filter(~Q(label_id__in=label_ids), is_deleted=False)
            )
            labeled_items_for_restore.extend(cls._restore_items(labeled_items, content_object_history_id))

        cls.clear(lookup_kwargs)
        bulk_create_with_history(labeled_items_for_restore, LabeledItem)

    @classmethod
    def restore_by_version(cls, instance: Model, history_id: int):
        labeled_items = LabelSelector.label_list_by_parent_object_and_history_ids(instance, history_id)
        content_type = ContentType.objects.get_for_model(instance)
        latest_history_id = instance.history.latest().history_id
        new_labeled_items = []
        for labeled_item in labeled_items:
            new_labeled_item = cls._restore_item(labeled_item, latest_history_id)
            new_labeled_items.append(new_labeled_item)
        LabeledItem.objects.filter(
            content_type=content_type,
            object_id=instance.id,
            content_object_history_id__lt=latest_history_id,
        ).delete()
        bulk_create_with_history(new_labeled_items, LabeledItem)

    @classmethod
    def add_labels_to_objects(  # noqa: WPS231
        cls,
        labels: list[dict[str, Any]],
        content_objects: list[_MT],
        content_type: ContentType,
        project: Project,
        user: User,
        is_recreate_existed: bool = False,
    ):
        if not labels:
            return

        existing_labels, labels_to_create = cls._prepare_labels(labels, project, user)
        labeled_items_to_create = []
        for content_object in content_objects:
            content_object_history_id = (
                content_object.history.first().history_id if hasattr(content_object, 'history') else None
            )

            existed_labels_in_object = []
            if is_recreate_existed:
                labeled_item_ids_to_delete = []
                for labeled_item in content_object.labeled_items.all():
                    labeled_item_ids_to_delete.append(labeled_item.id)
                    existed_labels_in_object.append(labeled_item.label_id)
                    labeled_items_to_create.append(cls._restore_item(labeled_item, content_object_history_id))
                LabeledItem.objects.filter(id__in=labeled_item_ids_to_delete).delete()

            for label_instance in chain(labels_to_create, existing_labels):
                if label_instance.id and label_instance.id in existed_labels_in_object and is_recreate_existed:
                    continue
                labeled_items_to_create.append(
                    LabeledItem(
                        label=label_instance,
                        object_id=content_object.id,
                        content_type=content_type,
                        content_object_history_id=content_object_history_id,
                    ),
                )
        Label.objects.bulk_create(labels_to_create)
        bulk_create_with_history(labeled_items_to_create, LabeledItem)

    @classmethod
    def clear(cls, lookup_kwargs: dict[str, Any]):
        LabeledItem.objects.filter(**lookup_kwargs).delete()

    @classmethod
    def _restore_item(cls, labeled_item: LabeledItem, history_id: int):
        new_labeled_item = deepcopy(labeled_item)
        new_labeled_item.pk = None
        new_labeled_item.is_deleted = False
        new_labeled_item.deleted_at = None
        new_labeled_item.content_object_history_id = history_id
        return new_labeled_item

    @classmethod
    def _restore_items(cls, labeled_items: QuerySet[LabeledItem], history_id: int):
        items_for_restore = []
        for labeled_item in labeled_items:
            items_for_restore.append(cls._restore_item(labeled_item, history_id))
        return items_for_restore

    @classmethod
    def _force_create_history(cls, content_objects: list[_MT], user: User, content_model: type[_MT]) -> None:
        histories = []
        for content_object in content_objects:
            if not hasattr(content_object, 'history'):
                return
            latest_history = deepcopy(content_object.history.first())
            latest_history.history_id = None
            latest_history.reason = 'Bulk label creation'
            latest_history.history_date = timezone.now()
            latest_history.history_user = user
            histories.append(latest_history)
        history_manager = get_history_manager_for_model(content_model)
        history_manager.bulk_create(histories)

    @classmethod
    def _prepare_labels(
        cls,
        labels: list[dict[str, Any]],
        project: Project,
        user: User,
    ) -> tuple[QuerySet[Label], list[Label]]:
        condition = Q()
        for label in labels:
            condition |= Q(name__iexact=label['name'].strip(), project=project)
        existing_labels = Label.objects.filter(condition)
        existing_labels_name = existing_labels.annotate(lower_name=Lower('name')).values_list('lower_name', flat=True)
        labels_to_create = []
        for label in labels:
            name = label[_NAME].strip()
            if name.lower() in existing_labels_name:
                continue
            labels_to_create.append(
                cls.label_create(
                    {_NAME: name, 'type': LabelTypes.CUSTOM, 'project': project, 'user': user},
                    commit=False,
                ),
            )
        return existing_labels, labels_to_create

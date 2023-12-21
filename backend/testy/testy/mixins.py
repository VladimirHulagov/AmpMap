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
from typing import Set, Union

from core.api.v1.serializers import RecoveryInputSerializer
from core.services.recovery import RecoveryService
from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.core.exceptions import FieldDoesNotExist
from django.db.models import CASCADE, ManyToManyRel, ManyToOneRel
from django.utils import timezone
from mptt.models import MPTTModel
from paginations import StandardSetPagination
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from utilities.string import get_sha256_from_value


class RelationTreeMixin:
    def build_relation_tree(self, model, tree: list = None) -> Set[Union[ManyToOneRel, GenericRelation, ManyToManyRel]]:
        """
        Build tree of relations by model to prevent duplicate recursive queries gathering.

        Args:
            model: model class.
            tree: list of gathered relations.

        Returns:
            set of different gathered relations.
        """
        if not tree:
            tree = []
        related_objects = [related_object for related_object in model._meta.related_objects]
        related_objects.extend(model._meta.private_fields)
        for single_object in related_objects:
            if not isinstance(single_object, GenericRelation):
                if not single_object.identity[6] == CASCADE:  # on_delete option is kept in identity with index 6
                    continue
            if single_object.model == single_object.related_model:
                continue
            self._check_for_relation(single_object, tree)
            if single_object.related_model._meta.related_objects:
                self.build_relation_tree(single_object.related_model, tree)
        return set(tree)

    def get_all_related_querysets(self, qs, model, result_list=None, deleted: bool = False, relation_tree=None,
                                  ignore_on_delete_property: bool = False):
        """
        Recursive function to get all related objects of instance as list of querysets.

        Args:
            qs: queryset or instance to find related objects for.
            model: model in which we are looking for relations.
            result_list: list to gather querysets in.
            deleted: defines which manager to use for getting querysets.
            relation_tree: List of relations to avoid duplicate querysets.
            ignore_on_delete_property: ignore on_delete property in gathering related querysets.

        Returns:
            List of querysets.
        """
        manager = 'deleted_objects' if deleted else 'objects'
        if result_list is None:
            result_list = []
        related_objects = [related_object for related_object in model._meta.related_objects]
        related_objects.extend(model._meta.private_fields)
        for single_object in related_objects:
            if not isinstance(single_object, GenericRelation):
                if not single_object.identity[6] == CASCADE and not ignore_on_delete_property:
                    continue
            if single_object.model == single_object.related_model:
                continue
            if single_object not in relation_tree:
                continue
            if not isinstance(single_object, GenericRelation):
                filter_option = {f'{single_object.field.attname}__in': [instance.id for instance in qs]}
            else:
                filter_option = {
                    f'{single_object.object_id_field_name}__in': [instance.id for instance in qs],
                    f'{single_object.content_type_field_name}': ContentType.objects.get_for_model(model)
                }
            if isinstance(single_object.related_model, MPTTModel):
                new_qs = getattr(single_object.related_model, manager).filter(**filter_option).get_descendants(
                    include_self=True
                )
            else:
                new_qs = getattr(single_object.related_model, manager).filter(**filter_option)
            result_list.append(
                {
                    'queryset': new_qs,
                    'verbose_name': single_object.related_model._meta.verbose_name_plural,
                    'verbose_name_related_model': single_object.model._meta.verbose_name_plural,
                    'count': new_qs.count()
                }
            )
            if single_object.related_model._meta.related_objects:
                self.get_all_related_querysets(
                    new_qs,
                    single_object.related_model,
                    result_list,
                    deleted,
                    relation_tree,
                    ignore_on_delete_property
                )
        return result_list

    @staticmethod
    def _check_for_relation(new_relation: Union[GenericRelation, ManyToManyRel, ManyToOneRel], relations):
        """Decide if new gathered relation clashes with previously found relations."""
        if isinstance(new_relation, GenericRelation):
            relations.append(new_relation)
            return
        for idx, relation in enumerate(relations):
            if new_relation.related_model != relation.related_model:
                continue
            if new_relation.model == relation.model:
                return
            if new_relation.model.ModelHierarchyWeightMeta.weight > relation.model.ModelHierarchyWeightMeta.weight:
                relations[idx] = new_relation
        relations.append(new_relation)


class TestyDestroyModelMixin(RelationTreeMixin):

    def destroy(self, request, pk, *args, **kwargs):
        """
        Replacement for default destroy action, if user retrieved deleted objects, we save gathered querysets to
        cache and if he submits deletion within time gap use user cookie to retrieve cache and delete objects.
        """
        querysets_to_delete = None
        target_object = self.get_object()
        tree_id = target_object.tree_id if isinstance(target_object, MPTTModel) else None
        model_class = type(target_object)
        if cache_key := request.COOKIES.get('delete_cache'):
            objects_to_delete = cache.get(cache_key, {})
            if objects_to_delete.get('target_object') == target_object:
                querysets_to_delete = objects_to_delete['querysets_to_delete']
            cache.delete(cache_key)
        if not querysets_to_delete:
            querysets_to_delete, _ = self.get_deleted_objects()
        for related_qs in querysets_to_delete:
            related_qs.delete()
        if tree_id:
            model_class.objects.partial_rebuild(tree_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        methods=['get'],
        url_path='delete/preview',
        url_name='delete-preview',
        detail=True,
    )
    def delete_preview(self, request, pk):
        """Get preview of objects to delete, retrieved querysets are cached."""
        related_querysets, objects_info = self.get_deleted_objects()
        objects_to_delete = {
            'target_object': self.get_object(),
            'querysets_to_delete': related_querysets
        }
        cache_key = get_sha256_from_value(str(related_querysets) + str(timezone.now()))
        cache.set(cache_key, objects_to_delete)
        response = Response(data=objects_info)
        response.set_cookie('delete_cache', cache_key, max_age=settings.CACHE_TTL)
        return response

    @action(
        detail=False,
        methods=['post'],
        url_path='deleted/remove',
        url_name='deleted-remove',
    )
    def delete_permanently(self, request):
        serializer = RecoveryInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        RecoveryService.delete_permanently(self.get_queryset(), serializer.validated_data)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_deleted_objects(self):
        instance = self.get_object()
        qs = RecoveryService.get_objects_by_instance(instance)
        relation_tree = self.build_relation_tree(qs.model)
        related_querysets_info = self.get_all_related_querysets(
            qs,
            qs.model,
            relation_tree=relation_tree
        )
        related_querysets_info.append(
            {
                'queryset': qs,
                'verbose_name': 'source model',
                'verbose_name_related_model': qs.model()._meta.verbose_name_plural,
                'count': qs.count()
            }
        )
        related_querysets = []
        for info in related_querysets_info:
            related_querysets.append(info.pop('queryset'))
        return related_querysets, related_querysets_info


class TestyArchiveMixin(RelationTreeMixin):

    @action(
        methods=['get'],
        url_path='archive/preview',
        url_name='archive-preview',
        detail=True,
    )
    def archive_preview(self, request, pk):
        related_querysets, objects_info = self.get_objects_to_archive()
        objects_to_archive = {
            'target_object': self.get_object(),
            'querysets_to_archive': related_querysets
        }
        cache_key = get_sha256_from_value(str(related_querysets) + str(timezone.now()))
        cache.set(cache_key, objects_to_archive)
        response = Response(data=objects_info)
        response.set_cookie('archive_cache', cache_key, max_age=settings.CACHE_TTL)
        return response

    @action(
        methods=['post'],
        url_path='archive',
        url_name='archive-commit',
        detail=True,
    )
    def archive_objects(self, request, pk):
        querysets_to_archive = None
        if cache_key := request.COOKIES.get('archive_cache'):
            objects_to_delete = cache.get(cache_key, {})
            if objects_to_delete.get('target_object') == self.get_object():
                querysets_to_archive = objects_to_delete['querysets_to_archive']
            cache.delete(cache_key)
        if not querysets_to_archive:
            querysets_to_archive, _ = self.get_objects_to_archive()
        for related_qs in querysets_to_archive:
            related_qs.update(is_archive=True)
        return Response(status=status.HTTP_200_OK)

    @action(
        methods=['post'],
        url_path='archive/restore',
        url_name='archive-restore',
        detail=False,
    )
    def restore_archived(self, request):
        serializer = RecoveryInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qs = RecoveryService.get_objects_by_ids(self.get_queryset(), serializer.validated_data)
        model_class = qs.model()
        relation_tree = self.build_relation_tree(model_class)
        related_querysets_info = [
            elem['queryset'] for elem in self.get_all_related_querysets(
                qs,
                model_class,
                relation_tree=relation_tree,
                ignore_on_delete_property=True
            )
        ]
        related_querysets_info.append(qs)
        for queryset in related_querysets_info:
            try:
                queryset.model()._meta.get_field('is_archive')
            except FieldDoesNotExist:
                continue
            queryset.update(is_archive=False)
        return Response(status=status.HTTP_200_OK)

    def get_objects_to_archive(self):
        instance = self.get_object()
        qs = RecoveryService.get_objects_by_instance(instance)
        relation_tree = self.build_relation_tree(qs.model)
        related_querysets_info = self.get_all_related_querysets(
            qs,
            qs.model,
            relation_tree=relation_tree,
            ignore_on_delete_property=True
        )
        related_querysets_info.append(
            {
                'queryset': qs,
                'verbose_name': 'source model',
                'verbose_name_related_model': qs.model()._meta.verbose_name_plural,
                'count': qs.count()
            }
        )
        related_querysets_with_archived = []
        for info in related_querysets_info:
            try:
                archive_exists = info['queryset'].model()._meta.get_field('is_archive')
            except FieldDoesNotExist:
                archive_exists = None
            if archive_exists is None:
                continue
            related_querysets_with_archived.append(info)
        related_querysets = []
        for info in related_querysets_with_archived:
            related_querysets.append(info.pop('queryset'))
        return related_querysets, related_querysets_with_archived


class TestyRestoreModelMixin(RelationTreeMixin):

    @action(
        methods=['post'],
        url_path='deleted/recover',
        url_name='deleted-recover',
        detail=False,
    )
    def restore(self, request):
        serializer = RecoveryInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qs = RecoveryService.get_objects_by_ids(self.get_queryset(), serializer.validated_data)
        model_class = qs.model()
        relation_tree = self.build_relation_tree(model_class)
        related_querysets = [
            elem['queryset'] for elem in self.get_all_related_querysets(
                qs,
                model_class,
                deleted=True,
                relation_tree=relation_tree
            )
        ]
        related_querysets.append(qs)
        for related_qs in related_querysets:
            related_qs.restore()
            if not issubclass(related_qs.model, MPTTModel) or not related_qs:
                continue
            tree_ids_to_rebuild = [elem.tree_id for elem in related_qs]
            tree_ids_to_rebuild = set(tree_ids_to_rebuild)
            for tree_id in tree_ids_to_rebuild:
                related_qs.model.objects.partial_rebuild(tree_id)
        return Response(status=status.HTTP_200_OK)

    @action(
        methods=['get'],
        url_path='deleted',
        url_name='deleted-list',
        detail=False,
    )
    def recovery_list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        pagination = StandardSetPagination()
        page = pagination.paginate_queryset(queryset, request)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return pagination.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class TestyModelViewSet(mixins.CreateModelMixin,
                        mixins.RetrieveModelMixin,
                        mixins.UpdateModelMixin,
                        TestyDestroyModelMixin,
                        TestyRestoreModelMixin,
                        mixins.ListModelMixin,
                        GenericViewSet):
    pass

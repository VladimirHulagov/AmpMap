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
from django.db.models import Q
from django_filters import rest_framework as filters
from notifications.models import Notification
from rest_framework.filters import OrderingFilter

from testy.core.models import Attachment, CustomAttribute, Label, NotificationSetting, Project
from testy.core.selectors.projects import ProjectSelector
from testy.filters import ArchiveFilterMixin, project_filter
from testy.utilities.request import get_user_favorites


class ProjectOrderingFilter(OrderingFilter):

    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        favorite_conditions = Q(pk__in=get_user_favorites(request))
        if ordering:
            queryset = queryset.annotate(priority=ProjectSelector.favorites_annotation(favorite_conditions))
            return queryset.order_by('priority', *ordering)

        return queryset


class ProjectFilter(ArchiveFilterMixin, filters.FilterSet):
    name = filters.CharFilter(lookup_expr='icontains')
    favorites = filters.BooleanFilter('pk', method='display_favorites')

    class Meta:
        model = Project
        fields = ('name', 'favorites')

    def display_favorites(self, queryset, field_name, only_favorites):
        favorite_conditions = Q(**{f'{field_name}__in': get_user_favorites(self.request)})

        if only_favorites:
            return queryset.filter(favorite_conditions).order_by('name')

        return (
            queryset
            .annotate(
                priority=ProjectSelector.favorites_annotation(favorite_conditions),
            )
            .order_by('priority', 'name')
        )


class AttachmentFilter(filters.FilterSet):
    project = project_filter()

    class Meta:
        model = Attachment
        fields = ('project',)


class LabelFilter(filters.FilterSet):
    project = project_filter()

    ordering = filters.OrderingFilter(
        fields=(
            ('id', 'id'),
            ('name', 'name'),
            ('type', 'type'),
        ),
    )

    class Meta:
        model = Label
        fields = ('project',)


class CustomAttributeFilter(filters.FilterSet):
    project = project_filter()
    suite = filters.NumberFilter(field_name='suite_ids', method='filter_by_suite')

    @classmethod
    def filter_by_suite(cls, queryset, field_name, val):
        non_suite_specific = queryset.filter(is_suite_specific__exact=False)
        suite_specific = queryset.filter(**{f'{field_name}__icontains': val})
        return non_suite_specific | suite_specific

    class Meta:
        model = CustomAttribute
        fields = ('suite',)


class NotificationFilter(filters.FilterSet):
    ordering = filters.OrderingFilter(
        fields=(
            ('id', 'id'),
            ('unread', 'unread'),
        ),
    )

    class Meta:
        model = Notification
        fields = ('unread',)


class NotificationSettingFilter(filters.FilterSet):
    verbose_name = filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = NotificationSetting
        fields = ('action_code',)

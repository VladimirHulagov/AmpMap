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
import logging
import time
from contextlib import contextmanager
from hashlib import md5, sha256
from pathlib import Path, PurePath
from typing import Any, Callable, Dict, List, Union

from celery_progress.backend import ProgressRecorder
from django.db import models
from django.db.models import Func, Prefetch, Subquery, Value


class ProgressRecorderContext(ProgressRecorder):
    def __init__(self, task, total, debug=False, description='Task started'):
        self.debug = debug
        self.current = 0
        self.total = total
        if self.debug:
            return
        super().__init__(task)
        self.set_progress(current=self.current, total=total, description=description)

    @contextmanager
    def progress_context(self, description):
        if self.debug:
            logging.info(description)
            yield
            return
        self.current += 1
        self.set_progress(self.current, self.total, description)
        yield

    def clear_progress(self):
        self.current = 0


class SubCount(Subquery):
    template = "(SELECT count(*) FROM (%(subquery)s) _count)"
    output_field = models.IntegerField()


def get_attachments_file_path(instance, filename):  # Exists because we don't want to alter older migrations
    return get_media_file_path(instance, filename, 'attachments')


def get_media_file_path(instance, original_filename, media_name):
    extension = Path(original_filename).suffix
    new_filename = f'{md5(str(time.time()).encode()).hexdigest()}{extension}'
    return PurePath(media_name, new_filename[:2], new_filename)


def parse_bool_from_str(value):
    if str(value).lower() in ['1', 'yes', 'true']:
        return True
    return False


def form_tree_prefetch_lookups(nested_prefetch_field: str, prefetch_field: str, tree_depth) -> List[str]:
    """
    Form list of lookups for nested objects.

    Args:
        nested_prefetch_field: child field for instance
        prefetch_field: field to be prefetched on child
        tree_depth: MPTTModel max tree depth

    Returns:
        List of prefetch lookups. Where first element is prefetch field

    Example:
        Form nested lookups for field test_cases for child_test_suites:
        input -> form_tree_prefetch_lookups('child_test_suites', 'test_cases', 2)
        output -> 'test_cases', 'child_test_suites__test_cases', 'child_test_suites__child_test_suites__test_cases'
    """
    queries = [prefetch_field]
    for count in range(1, tree_depth + 1):
        query = '__'.join([nested_prefetch_field for _ in range(count)]) + '__' + prefetch_field
        queries.append(query)
    return queries


def form_tree_prefetch_objects(
    nested_prefetch_field: str,
    prefetch_field: str,
    tree_depth: int,
    queryset_class=None,
    annotation: Dict[str, Any] = None,
    queryset_filter: Dict[str, Any] = None,
    order_by_fields: List[str] = None,
    queryset=None,
    to_attr: str = None,
    manager_name: str = 'objects'
) -> List[Prefetch]:
    """
    Form a list of prefetch objects for MPTTModels prefetch.

    Args:
        nested_prefetch_field: child field name for prefetching
        prefetch_field: field name that will be prefetched in child
        tree_depth: MPTTModel element max depth
        queryset_class: Model class of queryset to be added inside prefetch object
        annotation: Dict for .annotate() method keys = fields, values = anything for annotation like Count()
        queryset_filter: Dict for .filter() method keys = fields, values = values to filter by in specified field
        order_by_fields: ordering fields
        queryset: queryset to provide for Prefetch objects
        order_by_fields: List of ordering fields
        to_attr: name of attr to add to instances in queryset
        manager_name: manager name to get objects from model

    Returns:
        List of Prefetch objects
    """
    if not order_by_fields:
        order_by_fields = []
    if not annotation:
        annotation = {}
    prefetch_objects_list = []
    for lookup_str in form_tree_prefetch_lookups(nested_prefetch_field, prefetch_field, tree_depth):
        if queryset is not None:
            qs = queryset.annotate(**annotation)
        elif queryset_filter:
            qs = (
                getattr(queryset_class, manager_name)
                .filter(**queryset_filter)
                .annotate(**annotation)
                .order_by(*order_by_fields)
            )
        else:
            qs = getattr(queryset_class, manager_name).all().annotate(**annotation).order_by(*order_by_fields)
        prefetch_objects_list.append(Prefetch(lookup_str, queryset=qs, to_attr=to_attr))
    return prefetch_objects_list


def get_breadcrumbs_treeview(instances, depth: int, title_method: Callable = None) -> Dict[str, Union[str, None]]:
    """
    Recursively get treeview dict of mptt tree model.

    Args:
        instances: ordered tree of ancestors for mptt tree element
        depth: len of tree -1
        title_method: method to get title, if not provided use model.name of instance
    """
    return {
        'id': instances[depth].id,
        'title': title_method(instances[depth]) if title_method else instances[depth].name,
        'parent': None if depth == 0 else get_breadcrumbs_treeview(instances, depth - 1, title_method)
    }


def get_sha256_from_value(value: str) -> str:
    return sha256(str(value).encode()).hexdigest()


def format_duration(value):
    weeks = value.days // 7
    days = value.days % 7
    hours = value.seconds // 3600
    minutes = value.seconds % 3600 // 60
    seconds = value.seconds % 3600 % 60
    periods = [weeks, days, hours, minutes, seconds]
    prefixes = ['w', 'd', 'h', 'm', 's']
    result_str = ''
    for period, prefix in zip(periods, prefixes):
        if not period:
            continue
        result_str += f'{period}{prefix} '
    return result_str.rstrip()


class DateTrunc(Func):
    function = 'DATE_TRUNC'

    def __init__(self, trunc_type, field_expression, **extra):
        super(DateTrunc, self).__init__(Value(trunc_type), field_expression, **extra)

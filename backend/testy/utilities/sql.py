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

from django.db.models import Func, IntegerField, Q, Subquery, UniqueConstraint, Value, fields
from mptt.models import MPTTModel


class SubCount(Subquery):
    template = '(SELECT count(*) FROM (%(subquery)s) _count)'
    output_field = IntegerField()


class DateTrunc(Func):
    function = 'DATE_TRUNC'

    def __init__(self, trunc_type, field_expression, **extra):
        super().__init__(Value(trunc_type), field_expression, **extra)


class ConcatSubquery(Subquery):
    template = 'ARRAY_TO_STRING(ARRAY(%(subquery)s), %(separator)s)'  # noqa: WPS323
    output_field = fields.CharField()

    def __init__(self, *args, separator=', ', **kwargs):
        self.separator = separator
        super().__init__(*args, **kwargs)

    def as_sql(self, compiler, connection, template=None, **extra_context):
        extra_context['separator'] = '%s'  # noqa: WPS323
        sql, sql_params = super().as_sql(compiler, connection, template, **extra_context)  # type: ignore
        sql_params = sql_params + (self.separator,)  # type: ignore
        return sql, sql_params


def rebuild_mptt(model: type[MPTTModel], tree_id: int):
    try:
        model.objects.partial_rebuild(tree_id)
    except RuntimeError:
        model.objects.rebuild()


def unique_soft_delete_constraint(field: str, model_name: str) -> UniqueConstraint:
    return UniqueConstraint(
        fields=[field],
        condition=Q(is_deleted=False),
        name=f'unique_{field}_value_on_{model_name}_for_soft_delete',
    )

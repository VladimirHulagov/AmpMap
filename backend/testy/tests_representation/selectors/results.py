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
from typing import TYPE_CHECKING, Any, Iterable, Optional

from comments.selectors.comments import CommentSelector
from django.db.models import CharField, OuterRef, QuerySet, Subquery, Value
from django.db.models.functions import Trunc
from tests_representation.exceptions import AttributeParameterIsAbsent

from testy.comments.models import Comment
from testy.tests_representation.models import Test, TestPlan, TestResult

if TYPE_CHECKING:
    from testy.comments.api.v2.serializers import CommentUnionSerializer
    from testy.tests_representation.api.v2.serializers import TestResultUnionSerializer

_TEST = 'test'
_CREATED_AT_DESC = '-created_at'
_ID = 'id'
_RESULT_STATUS = 'status'
_TYPE = 'type'
_COMMENT = 'comment'
_RESULT = 'result'


class TestResultSelector:
    @classmethod
    def result_list(cls) -> QuerySet[TestResult]:
        return TestResult.objects.all(
        ).order_by(
            _CREATED_AT_DESC,
        ).prefetch_related(
            'user', 'steps_results', 'attachments', _RESULT_STATUS,
        ).annotate(
            latest_result_id=cls.get_latest_result_by_test_subquery(),
        )

    @classmethod
    def result_by_test_plan_ids(cls, test_plan_ids, filters=None):
        if not filters:
            filters = {}
        return TestResult.objects.select_related(_TEST).filter(
            test__plan_id__in=test_plan_ids,
            **filters,
        )

    @classmethod
    def result_list_by_ids(cls, test_plan_ids: list[int]) -> QuerySet[TestResult]:
        return cls.result_list().filter(pk__in=test_plan_ids)

    @classmethod
    def result_by_attributes(
        cls,
        test_plan_id: Optional[int] = None,
        attribute_name: Optional[str] = None,
        attribute_value: Optional[str] = None,
    ) -> QuerySet[TestResult]:
        if not all([test_plan_id, attribute_value, attribute_name]):
            raise AttributeParameterIsAbsent
        return TestResult.objects.filter(
            test__plan_id=test_plan_id,
            **{f'attributes__{attribute_name}__iexact': attribute_value},
        )

    @classmethod
    def result_cascade_history_list_by_test_plan(cls, instance: TestPlan):
        instances = instance.get_descendants(include_self=True).values_list(_ID, flat=True)
        tests = Test.objects.filter(plan__in=instances).values_list(_ID, flat=True)
        # TODO: fix pagination issue on prod (request is slow if not all qs recieved)
        history_ids = list(
            TestResult.history
            .filter(test__in=tests)
            .values_list('history_id', flat=True),
        )
        return (
            TestResult
            .history
            .filter(history_id__in=history_ids)
            .order_by('-history_date')
            .prefetch_related('test', 'test__case', 'test__plan', 'project', 'history_user', _RESULT_STATUS)
            .annotate(
                action_day=Trunc('history_date', 'day'),
            )
        )

    @classmethod
    def get_last_status_subquery(cls, filters=None, outer_ref_key: str = _ID, status_field: str = _ID):
        if not filters:
            filters = []
        return Subquery(
            TestResult.objects.filter(
                *filters,
                test_id=OuterRef(outer_ref_key),
            ).prefetch_related(_RESULT_STATUS).order_by(_CREATED_AT_DESC).values(f'status__{status_field}')[:1],
        )

    @classmethod
    def get_latest_result_by_test_subquery(cls, outer_ref_key: str = 'test_id'):
        return Subquery(
            TestResult.objects.filter(
                test_id=OuterRef(outer_ref_key),
            ).order_by(_CREATED_AT_DESC).values(_ID)[:1],
        )

    @classmethod
    def result_list_by_tests(cls, tests: Iterable[Test]):
        return TestResult.objects.select_related(_TEST).filter(test_id__in=[test.id for test in tests])

    @classmethod
    def get_results_by_test(cls, test: Test) -> QuerySet[TestResult]:
        return cls.result_list().filter(test=test)

    @classmethod
    def union_results_and_comments(
        cls,
        results: QuerySet[TestResult],
        comments: QuerySet[Comment],
        type_union: str | None = None,
    ) -> QuerySet:
        values = ('id', 'type', 'created_at')

        results_prepared = (
            results
            .annotate(type=Value('result', output_field=CharField()))
            .values(*values)
        )

        comments_prepared = (
            comments
            .annotate(type=Value('comment', output_field=CharField()))
            .values(*values)
        )
        queryset = results_prepared.union(comments_prepared)
        if type_union and type_union.lower() == _RESULT.lower():
            queryset = results_prepared
        if type_union and type_union.lower() == _COMMENT.lower():
            queryset = comments_prepared
        return queryset.order_by('created_at')

    @classmethod
    def get_union_data(  # noqa: WPS231
        cls,
        union_data: QuerySet[dict[str, Any]],
        result_serializer: 'type[TestResultUnionSerializer]',
        comment_serializer: 'type[CommentUnionSerializer]',
    ) -> list[dict[str, Any]]:
        result_ids = []
        comment_ids = []

        for elem in union_data:
            if elem[_TYPE] == _RESULT:
                result_ids.append(elem[_ID])
            elif elem[_TYPE] == _COMMENT:
                comment_ids.append(elem[_ID])

        db_results = cls.result_list_by_ids(result_ids).annotate(type=Value('result', output_field=CharField()))
        db_comments = (
            CommentSelector
            .comment_list_by_ids(comment_ids)
            .annotate(type=Value('comment', output_field=CharField()))
        )
        results = {result.pk: result for result in db_results}
        comments = {comment.pk: comment for comment in db_comments}

        result_data = []

        for elem in union_data:
            serializer = result_serializer if elem[_TYPE] == _RESULT else comment_serializer
            objects_dict = results if elem[_TYPE] == _RESULT else comments
            if data_dict := objects_dict.get(elem[_ID]):
                result_data.append(serializer(data_dict).data)
        return result_data

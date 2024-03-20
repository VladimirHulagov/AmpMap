import { LazyQueryTrigger } from "@reduxjs/toolkit/dist/query/react/buildHooks"
import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query"
import { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { BaseQueryFn, FetchArgs, QueryDefinition } from "@reduxjs/toolkit/query"

export type LazyGetTriggerType<T> = LazyQueryTrigger<
  QueryDefinition<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    QueryWithPagination<Record<any, any>>,
    BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta>,
    never,
    PaginationResponse<T[]>,
    "api"
  >
>

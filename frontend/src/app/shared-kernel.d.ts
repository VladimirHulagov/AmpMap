type Modify<T, R> = Omit<T, keyof R> & R

type Id = number
type Statuses = "Failed" | "Passed" | "Skipped" | "Broken" | "Blocked" | "Untested" | "Retest"
type StatusesCaps = "FAILED" | "PASSED" | "SKIPPED" | "BROKEN" | "BLOCKED" | "UNTESTED" | "RETEST"
type BaseParams = Record<string, string | undefined>
interface ParamTestSuiteId extends BaseParams {
  testSuiteId: string
}
interface ParamProjectId extends BaseParams {
  projectId: string
}
interface ParamTestPlanId extends BaseParams {
  testPlanId: string
}
interface Attribute {
  id: string
  name: string
  value: string | object
  type: "txt" | "list" | "json"
}
interface TreeCheckboxInfo {
  checked: boolean
  node: InfoNode
}

type CheckboxChecked =
  | Key[]
  | {
      checked: Key[]
      halfChecked: Key[]
    }

interface InfoNode {
  key: string
  halfChecked: boolean
  test_cases: { id: number; name: string }[]
  children: InfoNode[] | { key: string; title: string }[]
}

interface PaginationResponse<T> {
  count: number
  links: {
    next: null | number
    previous: null | number
  }
  pages: {
    current: number
    total: number
    next: null | number
    previous: null | number
  }
  results: T
}

interface PaginationQuery {
  page_size?: number
  page?: number
}

type QueryWithPagination<T> = PaginationQuery & T

type ModalMode = "edit" | "create"
interface CropPositions {
  left: number
  right: number
  upper: number
  lower: number
}
type Models = "test" | "testcase" | "testresult" | "testsuite" | "testplan"
type Ordering = "asc" | "desc"
type EstimatePeriod = "minutes" | "hours" | "days"
interface BaseData {
  id: Id
  name: string
  title: string
  children?: T[]
}
interface SelectData {
  label: string
  value: number
}
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type DataWithKey<T> = T & BaseData & { key: string | Key }
interface BaseResponse {
  id: string | Id
  name: string
}

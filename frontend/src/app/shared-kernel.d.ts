type Modify<T, R> = Omit<T, keyof R> & R

type Id = number
type Statuses = "Failed" | "Passed" | "Skipped" | "Broken" | "Blocked" | "Untested" | "Retest"
type StatusesCaps = "FAILED" | "PASSED" | "SKIPPED" | "BROKEN" | "BLOCKED" | "UNTESTED" | "RETEST"
type ParamTestSuiteId = { testSuiteId: string }
type ParamProjectId = { projectId: string }
type ParamTestPlanId = { testPlanId: string }
type Attribute = {
  id: string
  name: string
  value: string | object
  type: "txt" | "list" | "json"
}
type TreeCheckboxInfo = {
  checked: boolean
  node: InfoNode
}

type CheckboxChecked =
  | Key[]
  | {
      checked: Key[]
      halfChecked: Key[]
    }

type InfoNode = {
  key: string
  halfChecked: boolean
  test_cases: { id: number; name: string }[]
  children: InfoNode[] | { key: string; title: string }[]
}

type PaginationResponse<T> = {
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

type PaginationQuery = {
  page_size?: number
  page?: number
}

type QueryWithPagination<T> = PaginationQuery & T

type ModalMode = "edit" | "create"
type CropPositions = { left: number; right: number; upper: number; lower: number }
type Models = "test" | "testcase" | "testresult" | "testsuite" | "testplan"

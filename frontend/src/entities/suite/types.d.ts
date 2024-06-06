interface SuiteState {
  testSuite: Suite | null
}

interface Suite {
  id: Id
  name: string
  title: string
  parent: Parent | null
  project: number
  url: string
  cases_count: number
  total_cases_count: number
  descendant_count: number
  description: string
  child_count: number
  estimates: string | null
  total_estimates: string | null
  breadcrumbs: Breadcrumbs
}

interface SuiteTree extends Suite {
  children: SuiteTree[]
}

interface SuiteWithCases extends Suite {
  test_cases: TestCase[]
  children: SuiteWithCases[]
}

interface SuiteUpdate {
  name: string
  description: string
  parent: string | null
}

interface SuiteCreate {
  name: string
  project: number
  parent?: string | null
  description?: string
}

interface GetTestSuiteQuery {
  suiteId: string
}

interface GetTestSuitesTreeViewQuery {
  project?: string
  parent?: string
  treeview?: boolean
  search?: string
  ordering?: string
  is_flat?: boolean
  page?: number
  page_size?: number
  _cacheInvalidation?: number
}

interface CopySuiteResponse {
  id: Id
  description: string
  name: string
  parent: number | null
  project: number | null
  url: string
  path: string
}

interface SuiteCopyBody {
  suites: SuiteCopyItem[]
  dst_project_id: string
  dst_suite_id?: string
}

interface SuiteCopyItem {
  id: string
  new_name: string
}

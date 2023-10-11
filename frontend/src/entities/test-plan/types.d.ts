interface TestPlanState {
  showArchivedTests: boolean
  showArchivedResults: boolean
}

interface ITestPlanQuery {
  projectId: string | undefined
  showArchive: boolean
  parent?: string
  search?: string
  ordering?: string
  is_flat?: boolean
}

interface ITestPlan {
  id: Id
  name: string
  description: string
  parent: number | null
  parameters: number[]
  started_at: string
  due_date: string
  finished_at: string | null
  is_archive: boolean
  project: number
  child_test_plans: number[]
  url: string
  title: string
  description: string
}

interface ITestPlanTreeView {
  id: Id
  key: string
  value: number
  title: string
  name: string
  description: string
  is_archive: boolean
  level: number
  children: ITestPlanTreeView[]
  parent: number | null
  project: number
  started_at: string
  due_date: string
  finished_at: string | null
}

interface TestPlanTreeViewQueryParams {
  testPlanId: string
  is_archive?: boolean
}

interface ITestPlanUpdate {
  name: string
  description: string
  parent: number | null
  test_cases: string[]
  started_at: string
  due_date: string
}

interface ITestPlanCreate extends ITestPlan {
  description: string
  test_cases: string[]
  parent: number | null
  started_at: MomentInput
  due_date: MomentInput
}

interface ITestPlanStatistics {
  label: string
  value: number
}

interface TestPlanParents {
  id: Id
  title: string
  parent: TestPlanParents | null
}

interface TestPlanStatisticsParams {
  testPlanId: string
  labels?: string[]
  labels_condition?: string
}

type TestPlanActivityPagination = {
  next: null | number
  previous: null | number
}

interface BreadCrumbsActivityResult {
  id: number
  title: string
  parent: BreadCrumbsActivityResult | null
}

interface TestPlanActivityResult {
  id: number
  action: "added" | "deleted" | "updated" | "unknown"
  action_timestamp: string
  breadcrumbs: BreadCrumbsActivityResult
  status_text: Statuses
  test_id: number
  test_name: string
  username: string
  avatar_link: string | null
}

interface TestPlanActivityParams {
  testPlanId: string
  page_size?: number
  page?: number
  search?: string
}

interface TestPlanActivity {
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
  results: {
    [keyData: string]: TestPlanActivityResult[]
  }
}

interface TestPlanParent {
  id: Id
  title: string
  parent: TestPlanParent | null
}

interface TestPlanSuite {
  id: Id
  title: string
  is_used: boolean
  children: TestPlanSuite[]
}

interface TestPlanCasesParams {
  testPlanId: string
  include_children?: boolean
}

interface TestPlanHistogramParams {
  testPlanId: string
  start_date?: string
  end_date?: string
  attribute?: string
}

interface TestPlanHistogramData {
  point: string
  failed: number
  passed: number
  skipped: number
  broken: number
  blocked: number
  retest: number
}

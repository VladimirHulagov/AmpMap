interface TestPlanState {
  showArchivedTests: boolean
  showArchivedResults: boolean
  tests: Test[]
}

interface TestPlanQuery {
  projectId: string | undefined
  is_archive?: boolean
  parent?: string
  search?: string
  ordering?: string
  is_flat?: boolean
}

interface TestPlan {
  id: Id
  name: string
  description: string
  parent: Parent | null
  parameters: number[]
  started_at: string
  due_date: string
  finished_at: string | null
  is_archive: boolean
  project: number
  child_count: number
  url: string
  title: string
  description: string
  breadcrumbs: Breadcrumbs
}

interface TestPlanTreeView {
  id: Id
  title: string
  name: string
  description: string
  is_archive: boolean
  level: number
  children: TestPlanTreeView[]
  parent: number | null
  project: number
  started_at: string
  due_date: string
  finished_at: string | null
  test_cases?: TestPlanTestCase[]
  labels?: string[]
}

interface TestPlanQueryParams {
  testPlanId: string
  is_archive?: boolean
}

interface TestPlanUpdate {
  name: string
  description: string
  parent: number | null
  test_cases: string[]
  started_at: string
  due_date: string
}

interface TestPlanCreate extends TestPlan {
  description: string
  test_cases: string[]
  parent: number | null
  started_at: Dayjs
  due_date: Dayjs
}

interface TestPlanStatistics {
  label: string
  value: number
  estimates: number
  empty_estimates: number
  color: string
  id: number
}

interface TestPlanParents {
  id: Id
  title: string
  parent: TestPlanParents | null
}

interface TestPlanStatisticsParams {
  testPlanId: string
  labels?: string[]
  not_labels?: string[]
  labels_condition?: string
  estimate_period?: EstimatePeriod
  is_archive?: boolean
}

interface TestPlanActivityPagination {
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
  status_text: string
  status_color: string
  status: number
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
  labels?: string[]
  not_labels?: string[]
  labels_condition?: string
  is_archive?: boolean
}

interface TestPlanHistogramDataPoint {
  label: string
  color: string
  count: number
}

type TestPlanHistogramData = {
  point: string
} & Record<number, TestPlanHistogramDataPoint>

interface TestPlanCopyItem {
  plan: number
  new_name?: string
  started_at?: string
  due_date?: string
}

interface TestPlanCopyBody {
  plans: TestPlanCopyItem[]
  dst_plan?: number
  keep_assignee?: boolean
}

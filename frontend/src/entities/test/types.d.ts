interface TestState {
  test: Test | null
  settings: {
    table: TestTableParams
  }
}

interface Test {
  id: Id
  project: number
  case: number
  name: string
  last_status: string
  plan: number
  suite: number
  user: number
  is_archive: boolean
  created_at: string
  updated_at: string
  url: string
  suite_path: string
  assignee: string | null
  assignee_username: string | null
  avatar_link: string | null
}

interface ITestGet {
  plan: Id
  project: string
  is_archive: boolean
}

interface ITestGetWithFilters extends ITestGet {
  last_status?: string
  search?: string
  ordering?: string
}

interface TestTableParams {
  testPlanId?: number | null
  filters?: TestTableFilters
  pagination?: TablePaginationConfig
  sorter?: SorterResult<string>
  nonce?: number
}

interface TestTableFilters {
  plan?: number
  project?: string
  is_archive?: boolean[]
  page_size?: number
  page?: number
  last_status?: string[]
  name?: FilterValue
  labels?: string[]
  labels_condition?: string
  ordering?: string
  suite?: string[]
  assignee_username?: FilterValue | null
  suite_path?: FilterValue
}

interface TestUpdate {
  case?: number
  plan?: number
  assignee?: string
  is_archive?: boolean
}

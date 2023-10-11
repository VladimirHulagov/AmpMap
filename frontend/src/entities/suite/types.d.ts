interface SuiteState {
  testSuite: ISuite | null
}

interface ISuite {
  id: Id
  name: string
  title: string
  parent: string
  project: number
  key: string
  url: string
  cases_count: number
  descendant_count: number
  description: string
  children: ISuite[]
}

interface ISuiteWithCases extends ISuite {
  test_cases: ITestCase[]
  children: ISuiteWithCases[]
}

interface ISuiteUpdate {
  name: string
  description: string
  parent: string | null
}

interface ISuiteCreate {
  name: string
  project: number
  parent?: string | null
  description?: string
}

interface IGetTestSuiteQuery {
  suiteId: string
  treeview?: boolean
}

interface IGetTestSuitesTreeViewQuery {
  project?: string
  parent?: string
  treeview?: boolean
  show_cases?: boolean
  search?: string
  ordering?: string
  is_flat?: boolean
  page?: number
  page_size?: number
}

interface SuiteParents {
  id: Id
  title: string
  parent: SuiteParents | null
}

interface SuiteCopyBody {
  suite_ids: string[]
  dst_project_id: string
}

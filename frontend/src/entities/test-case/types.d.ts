interface TestCaseState {
  drawerTestCase: TestCase | null
  modal: {
    isShow: boolean
    isEditMode: boolean
  }
}

interface TestCase {
  id: Id
  name: string
  project: number
  suite: number
  setup: string
  scenario?: string
  expected: string | null
  steps: Step[]
  is_steps: boolean
  teardown: string
  estimate?: string | null
  description: string
  current_version: number
  versions: number[]
  attachments: IAttachment[]
  url: string
  labels: LabelInForm[]
  is_archive: boolean
}

interface TestCaseCreate {
  name: string
  project: number
  suite: number
  scenario?: string
  expected?: string
  steps?: StepUpload[]
  is_steps?: boolean
  setup?: string
  teardown?: string
  estimate?: string
  description?: string
  attachments?: number[]
}

interface TestCaseUpdate extends TestCase {
  attachments?: number[]
  steps: StepUpload[] | StepAttachNumber[]
  skip_history?: boolean
}

interface Step {
  id: string
  name: string
  scenario: string
  sort_order: number
  attachments: IAttachment[]
  expected?: string
}

interface StepAttachNumber {
  id: string
  name: string
  scenario: string
  scenario: string
  expected: string
  sort_order: number
  attachments: number[]
}

interface StepUpload {
  name: string
  scenario: string
  sort_order: number
  attachments?: number[]
}

interface GetTestCasesQuery {
  project: string
  suite?: string
  search?: string
  ordering?: string
  page?: number
  page_size?: number
  is_archive?: boolean
  treeview?: boolean
}

interface SearchTestCasesQuery {
  project: string
  id?: string
  suite?: string
  name?: string
}

interface TestCaseFormData {
  name: string
  scenario: string
  project: number
  suite: number
  expected?: string
  setup?: string
  teardown?: string
  estimate?: string | null
  description?: string
  attachments?: number[]
  steps?: Step[]
  is_steps?: boolean
  labels?: LabelInForm[]
}

interface TestCaseCopyBody {
  cases: TestCaseCopyItem[]
  dst_suite_id: string
}

interface TestCaseCopyItem {
  id: string
  new_name: string
}

interface TestCaseHistoryChange {
  action: "Created" | "Updated" | "Deleted"
  history_date: string
  version: number
  user: User | null
}

interface TestCaseTestsList {
  testCaseId: number
  ordering?: string
  last_status?: string
}

interface GetTestCaseByIdParams {
  testCaseId: string
  version?: string
}

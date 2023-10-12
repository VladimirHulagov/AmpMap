interface TestCaseState {
  testCase: TestCase | null
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
  key: string
  value: number
  current_version: number
  versions: number[]
  attachments: IAttachment[]
  url: string
  labels: LabelInForm[]
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
  suite: string
  project: string
  search?: string
  ordering?: string
  page?: number
  page_size?: number
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

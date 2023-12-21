interface IResult {
  id: Id
  project: number
  status: string
  status_text: string
  test: number
  user: number
  comment: string
  user_full_name: string
  avatar_link: string | null
  test_case_version?: number
  is_archive: boolean
  created_at: string
  updated_at: string
  url: string
  execution_time: number
  attachments: IAttachment[]
  attributes: TestResultAttribute
  steps_results: StepResult[]
}

interface IResultQuery {
  testId: string | undefined
  project: string
  showArchive: boolean
}

interface IResultCreate {
  test: number
  status?: string
  comment?: string
  is_archive?: boolean
  execution_time?: number
  attachments?: number[]
  attributes?: TestResultAttribute
  steps_results?: StepResultCreate[]
}

interface IResultUpdate {
  test: number
  status?: string
  comment?: string
  is_archive?: boolean
  execution_time?: number
  attachments?: number[]
  attributes?: TestResultAttribute
  steps_results?: StepResultUpdate[]
}

interface StepResult {
  id: number
  step: number
  name: string
  status: number
  sort_order: number
}

interface StepResultUpdate {
  id: string
  status: string
}

interface StepResultCreate {
  step: string
  status: string
}

interface ResultFormData {
  comment: string
  status: string
  attachments?: number[]
  steps?: Step[]
  attributes?: Attribute[]
}

type TestResultAttribute = Record<string, string[] | string | object>

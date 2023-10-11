interface ProjectState {
  projectId: Id | null
  project: IProject | null
  modal: {
    isShow: boolean
    isEditMode: boolean
  }
  showArchived: boolean
  isOnlyFavorites: boolean
}

interface IProject {
  id: Id
  url: string
  name: string
  description: string
  is_archive: boolean
  cases_count: number
  suites_count: number
  plans_count: number
  tests_count: number
}

interface IProjectUpdate {
  name: string
  description: string
  is_archive: boolean
}

interface ProjectsProgress {
  id: number
  tests_progress_period: number
  tests_progress_total: number
  tests_total: number
  title: string
}

interface ProjectProgressParams {
  period_date_start: string
  period_date_end: string
  projectId: string
}

interface DeletePreviewResponse {
  verbose_name: string
  verbose_name_related_model: string
  count: number
}

interface ProjectState {
  showArchived: boolean
  isOnlyFavorites: boolean
}

interface Project {
  id: Id
  url: string
  name: string
  icon?: string | null
  description: string
  is_archive: boolean
  cases_count: number
  suites_count: number
  plans_count: number
  tests_count: number
}

interface ProjectUpdate {
  name: string
  description: string
  is_archive: boolean
  icon?: RcFile
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

interface GetProjectsQuery {
  favorites?: boolean
  is_archive?: boolean
  name?: string
}

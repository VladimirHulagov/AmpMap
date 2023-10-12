interface UserState {
  user: User | null
  userConfig: UserConfig
  modal: {
    isShow: boolean
    isEditMode: boolean
  }
  modalProfile: {
    isShow: boolean
  }
}

interface User {
  id: Id
  url: string
  username: string
  first_name: string
  last_name: string
  email: string
  is_active: boolean
  is_staff: boolean
  date_joined: string
  groups: number[]
  avatar_link: string
}

interface UserCreate {
  email: string
  password: string
  first_name: string
  last_name: string
}

interface UserUpdate {
  email: string
  first_name: string
  last_name: string
}

interface UserConfig {
  ui: {
    is_open_sidebar: boolean
    drawer_size_test_case_details: number
    drawer_size_test_result_details: number
    graph_base_type: "pie" | "bar"
    graph_base_bar_type: "by_time" | "by_attr"
    graph_base_bar_attribute_input: string
    test_plan: Record<string, { start_date: string; end_date: string }>
  }
  projects: {
    is_only_favorite: boolean
    is_show_archived: boolean
    favorite: number[]
  }
  test_plans: {
    is_show_archived: boolean
  }
  crop?: string
}

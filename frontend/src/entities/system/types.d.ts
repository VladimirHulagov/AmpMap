interface SystemState {
  messages: SystemMessage[]
  hiddenMessageIds: number[]
}

interface SystemMessage {
  id: number
  content: string
  level: number
  is_active: boolean
  is_closing: boolean
  created_at: string
  updated_at: string
}

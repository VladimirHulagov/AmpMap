interface CustomAttributeState {
  modal: {
    isShow: boolean
    isEditMode: boolean
  }
  attribute?: CustomAttribute
}

interface CustomAttribute {
  id: number
  url: string
  project: number
  type: number
  name: string
  is_required: boolean
  is_suite_specific: boolean
  is_deleted: boolean
  suite_ids: number[]
  content_types: number[]
  status_specific?: number[]
}

interface GetCustomAttributesParams {
  project: string
  test?: number
}

interface CustomAttributeUpdate {
  project: number
  name: string
  type: number
  content_types: number[]
  is_required?: boolean
  is_suite_specific?: boolean
  suite_ids?: number[]
  status_specific?: number[]
}

type CustomAttributeTypes = "Text" | "List" | "JSON"

interface CustomAttributeContentTypeItemResponse {
  id: number
  app_label: string
  model: "testcase" | "testresult"
}

type CustomAttributeContentTypesResponse = CustomAttributeContentTypeItemResponse[]

interface CustomAttributeContentType {
  label: string
  value: number
}

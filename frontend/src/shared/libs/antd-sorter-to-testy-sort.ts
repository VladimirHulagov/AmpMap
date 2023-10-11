import { SorterResult } from "antd/lib/table/interface"

const fieldsFormats = {
  tests: {
    name: "case_name",
    assignee_username: "assignee",
  },
  plans: {
    title: "name",
    action_timestamp: "history_date",
  },
}

type FieldsType = "tests" | "plans"

export const antdSorterToTestySort = <T>(
  sorter: SorterResult<T> | SorterResult<T>[],
  fieldType?: FieldsType
): string => {
  if (Array.isArray(sorter) || !sorter.order) return ""
  let fieldTitle = sorter.field as string

  if (fieldType && Object.keys(fieldsFormats[fieldType]).length) {
    // @ts-ignore
    const newField = fieldsFormats[fieldType][fieldTitle]
    fieldTitle = newField || fieldTitle
  }

  if (sorter.order === "ascend") {
    return fieldTitle
  }

  if (sorter.order === "descend") {
    return `-${fieldTitle}`
  }

  return ""
}

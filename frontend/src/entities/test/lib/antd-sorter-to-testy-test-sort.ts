import { SorterResult } from "antd/lib/table/interface"

export const antdSorterToTestySort = <T>(sorter: SorterResult<T> | SorterResult<T>[]): string => {
  if (Array.isArray(sorter)) return ""
  if (!sorter.order) return ""
  let fieldTitle = sorter.field as string

  if (fieldTitle === "name") {
    fieldTitle = "case_name"
  }

  if (fieldTitle === "assignee_username") {
    fieldTitle = "assignee"
  }

  if (sorter.order === "ascend") {
    return fieldTitle
  }

  if (sorter.order === "descend") {
    return `-${fieldTitle}`
  }

  return ""
}

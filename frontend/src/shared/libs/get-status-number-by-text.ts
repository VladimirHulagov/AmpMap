import { statusesObject } from "shared/config"

export const getStatusNumberByText = (value: string): number | null => {
  const findStatus = Object.entries(statusesObject).find(
    ([, status]) => status.toLowerCase() === value.toLowerCase()
  )
  return findStatus ? Number(findStatus[0]) : null
}

export const getStatusNumberByTextAndUndefinedNull = (value: string): string => {
  const statusNum = getStatusNumberByText(value)
  return statusNum === 5 ? "null" : String(statusNum)
}

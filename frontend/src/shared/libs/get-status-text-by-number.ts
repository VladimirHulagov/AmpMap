import { statusesObject } from "shared/config"

export const getStatusTextByNumber = (value: keyof typeof statusesObject): Statuses => {
  return statusesObject[value]
}

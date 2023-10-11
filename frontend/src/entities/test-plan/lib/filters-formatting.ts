import { getStatusNumberByText } from "shared/libs"

export const filterStatusFormat = (statuses: string[]) => {
  return statuses.map((i) => getStatusNumberByText(String(i))).join(",")
}

export const filterActionFormat = (actions: string[]) => {
  return actions
    .map((action) => {
      switch (action) {
        case "added":
          return "+"
        case "deleted":
          return "-"
        case "updated":
          return "~"

        default:
          return ""
      }
    })
    .join(",")
}

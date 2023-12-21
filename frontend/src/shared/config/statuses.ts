export const statusesObject: Record<number, Statuses> = {
  "0": "Failed",
  "1": "Passed",
  "2": "Skipped",
  "3": "Broken",
  "4": "Blocked",
  "5": "Untested",
  "6": "Retest",
}

export const statuses = Object.entries(statusesObject).map(([statusNum, statusText]) => ({
  value: statusNum,
  label: statusText,
}))

export const tableColumnStatuses = [
  {
    value: "0",
    text: "Failed",
  },
  {
    value: "1",
    text: "Passed",
  },
  {
    value: "2",
    text: "Skipped",
  },
  {
    value: "3",
    text: "Broken",
  },
  {
    value: "4",
    text: "Blocked",
  },
  {
    value: "5",
    text: "Retest",
  },
  {
    value: "null",
    text: "Untested",
  },
]

export const statusesWithoutUntested = statuses.filter((i) => i.label !== "Untested")

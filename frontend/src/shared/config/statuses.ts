export const statusesObject: { [statusNum: string]: Statuses } = {
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

export const statusesWithoutUntested = statuses.filter((i) => i.label !== "Untested")

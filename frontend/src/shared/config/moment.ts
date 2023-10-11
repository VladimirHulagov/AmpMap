import { Moment } from "moment"

export const formatBaseDate = (date: Moment) => {
  return date.format("YYYY-MM-DD").toString()
}

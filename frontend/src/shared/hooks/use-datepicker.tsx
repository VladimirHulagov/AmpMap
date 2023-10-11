import moment, { Moment } from "moment"
import { useState } from "react"

export const useDatepicker = () => {
  const [dateTo, setDateTo] = useState<Moment | null>(moment())
  const [dateFrom, setDateFrom] = useState<Moment | null>(moment())

  const disabledDateFrom = (current: Moment) => {
    return current.isSameOrAfter(dateTo)
  }

  const disabledDateTo = (current: Moment) => {
    return current.isSameOrBefore(dateFrom)
  }

  return {
    dateTo,
    dateFrom,
    setDateTo,
    setDateFrom,
    disabledDateFrom,
    disabledDateTo,
  }
}

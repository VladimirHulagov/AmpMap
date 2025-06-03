import { StatisticType } from "widgets/test-plan"

export interface Item {
  id: number | null
  label: string
  value: number
  color: string
}

export interface StatisticLineProps {
  items: Item[]
  type: StatisticType
}

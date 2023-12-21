import { Select } from "antd"

const PERIODS = [
  { label: "minutes", value: "minutes" },
  { label: "hours", value: "hours" },
  { label: "days", value: "days" },
]

interface Props {
  setPeriod: (period: EstimatePeriod) => void
  value: EstimatePeriod
}

export const TestPlanPieEstimatesFilters = ({ setPeriod, value }: Props) => {
  const handleChange = (value: string) => {
    setPeriod(value as EstimatePeriod)
  }
  return (
    <div
      style={{
        marginLeft: 14,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Select
        placeholder="Please select"
        value={value}
        style={{ width: "100%", minWidth: 120 }}
        options={PERIODS}
        size="middle"
        defaultActiveFirstOption
        onChange={handleChange}
      />
    </div>
  )
}

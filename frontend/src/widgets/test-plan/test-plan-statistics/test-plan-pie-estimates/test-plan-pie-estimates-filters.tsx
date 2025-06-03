import { Row } from "antd"

import { Button } from "shared/ui"

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
  const handleChange = (newValue: string) => {
    setPeriod(newValue as EstimatePeriod)
  }

  return (
    <div
      style={{
        marginLeft: 14,
        display: "flex",
        alignItems: "center",
      }}
      data-testid="test-plan-pie-estimates-filters"
    >
      <Row align="middle" justify="end">
        {PERIODS.map((period) => (
          <Button
            key={period.value}
            data-testid={`test-plan-pie-estimates-filter-${period.value}`}
            color={value === period.value ? "secondary-linear" : "ghost"}
            onClick={() => handleChange(period.value)}
            type="button"
          >
            {period.label}
          </Button>
        ))}
      </Row>
    </div>
  )
}

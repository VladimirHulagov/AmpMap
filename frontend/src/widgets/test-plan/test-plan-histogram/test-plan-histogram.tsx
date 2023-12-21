import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { colors } from "shared/config"

type ValuesData = "passed" | "failed" | "skipped" | "broken" | "blocked" | "retest"

interface Props {
  data: TestPlanHistogramData[]
}

const dataEmpty = [
  {
    point: "No results",
    blocked: 0,
    broken: 0,
    failed: 0,
    passed: 0,
    retest: 0,
    skipped: 0,
  },
]

export const TestPlanHistogram = ({ data }: Props) => {
  const legendFormatter = (
    value: Uppercase<ValuesData>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entry: any,
    index: number
  ) => {
    return <span key={index}>{value}</span>
  }

  const getPrettyInterval = () => {
    const dataLen = data?.length || 1
    const len = Math.floor(dataLen / 8)
    return dataLen <= 10 ? 0 : len
  }

  const interval = getPrettyInterval()

  return (
    <ResponsiveContainer width="100%">
      <BarChart
        width={800}
        height={280}
        data={data.length ? data : dataEmpty}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="point" type="category" interval={interval} />
        <YAxis />
        <Tooltip />
        <Bar
          dataKey="passed"
          stackId="a"
          fill={colors.success}
          barSize={40}
          name="PASSED"
          values="passed"
        />
        <Bar
          dataKey="failed"
          stackId="a"
          fill={colors.error}
          barSize={40}
          name="FAILED"
          values="failed"
        />
        <Bar
          dataKey="skipped"
          stackId="a"
          fill={colors.skipped}
          barSize={40}
          name="SKIPPED"
          values="skipped"
        />
        <Bar
          dataKey="broken"
          stackId="a"
          fill={colors.broken}
          barSize={40}
          name="BROKEN"
          values="broken"
        />
        <Bar
          dataKey="blocked"
          stackId="a"
          fill={colors.bloked}
          barSize={40}
          name="BLOCKED"
          values="blocked"
        />
        <Bar
          dataKey="retest"
          stackId="a"
          fill={colors.warning}
          barSize={40}
          name="RETEST"
          values="retest"
        />
        <Legend formatter={legendFormatter} />
      </BarChart>
    </ResponsiveContainer>
  )
}

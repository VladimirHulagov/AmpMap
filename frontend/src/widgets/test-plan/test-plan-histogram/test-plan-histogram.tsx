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

interface Props {
  data: TestPlanHistogramData[]
}

const dataEmpty = [
  {
    point: "No results",
  },
]

type TestPlanHistogramBarData = { point: string } & Record<string, number>

const convertData = (data: TestPlanHistogramData[]): TestPlanHistogramBarData[] => {
  const newResult = [] as TestPlanHistogramBarData[]
  data.forEach((item) => {
    const resultItem = {} as TestPlanHistogramBarData
    Object.entries(item).forEach(([key, value]) => {
      if (key !== "point") {
        const v = value as TestPlanHistogramDataPoint
        resultItem[v.label] = v.count
      } else {
        const v = value as string
        resultItem.point = v
      }
    })
    newResult.push(resultItem)
  })

  return newResult
}

const createStatuses = (data: TestPlanHistogramData[]): { name: string; color: string }[] => {
  const result = {} as Record<string, string>
  data.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (key !== "point") {
        const v = value as TestPlanHistogramDataPoint
        result[v.label.toLocaleLowerCase()] = v.color
      }
    })
  })

  return Object.entries(result).map(([name, color]) => ({ name, color }))
}

export const TestPlanHistogram = ({ data }: Props) => {
  const legendFormatter = (
    value: Uppercase<keyof TestPlanHistogramBarData>,
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

  const convertedData = convertData(data)
  const statuses = createStatuses(data)

  return (
    <ResponsiveContainer width="100%">
      <BarChart
        width={800}
        height={280}
        data={convertedData.length ? convertedData : dataEmpty}
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
        {statuses.map((status) => (
          <Bar
            dataKey={status.name}
            stackId="a"
            fill={status.color}
            barSize={40}
            name={status.name}
            values={status.name}
            key={status.name}
          />
        ))}
        <Legend formatter={legendFormatter} />
      </BarChart>
    </ResponsiveContainer>
  )
}

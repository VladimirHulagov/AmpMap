import { Pie } from "shared/ui"

interface Props {
  data: TestPlanStatistics[]
  tableParams: TestTableParams
  setTableParams: (params: TestTableParams) => void
}

export const TestPlanPieCount = ({ data, tableParams, setTableParams }: Props) => {
  return <Pie tableParams={tableParams} setTableParams={setTableParams} data={data} type="value" />
}

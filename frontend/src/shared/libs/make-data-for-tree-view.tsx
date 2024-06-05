import { FileDoneOutlined, FolderOpenOutlined } from "@ant-design/icons"

export const makeTestSuitesWithCasesForTreeView = (
  items: SuiteWithCases[],
  testCases: TestCase[] = []
): DataWithKey<SuiteWithCases[]> => {
  const testSuitesTreeView: SuiteWithCases[] = items.map((item) => {
    return {
      ...item,
      key: `TS${item.id}`,
      title: item.title,
      icon: <FolderOpenOutlined />,
      children: makeTestSuitesWithCasesForTreeView(item.children, item.test_cases),
    }
  })

  const testCasesTreeView = testCases.map((item) => {
    return {
      key: String(item.id),
      title: item.name,
      icon: <FileDoneOutlined />,
      labels: item.labels,
    }
  })

  // @ts-expect-error
  return testSuitesTreeView.concat(testCasesTreeView)
}

export const makeTestSuitesForTreeView = (items: SuiteTree[]): DataWithKey<Suite>[] =>
  items.map((item) => ({
    ...item,
    key: item.id,
    title: item.title,
    icon: <FolderOpenOutlined />,
    children: makeTestSuitesForTreeView(item.children),
  }))

export const makeParametersForTreeView = (items: IParameter[]): IParameterTreeView[] => {
  const result: IParameterTreeView[] = []

  items.map((item) => {
    const parameter: IParameterTreeView = { key: item.id, title: item.data, value: item.id }

    if (item.group_name === "") {
      result.push(parameter)
    } else {
      const index = result.findIndex((i) => i.title === item.group_name)

      if (index === -1) {
        result.push({
          key: item.group_name,
          title: item.group_name,
          value: item.group_name,
          children: [parameter],
        })
      } else {
        // TODO fix it
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result[index].children!.push(parameter)
      }
    }
  })

  return result
}

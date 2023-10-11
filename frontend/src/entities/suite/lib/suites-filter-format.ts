interface TestPlanSuiteWithKey extends TestPlanSuite {
  key: string
  value: string
  children: TestPlanSuiteWithKey[]
}

export const suitesFilterFormat = (
  suites: TestPlanSuite[],
  newList: TestPlanSuiteWithKey[] = [],
  allKeys: string[] = []
): [TestPlanSuiteWithKey[], string[]] => {
  for (const suite of suites) {
    const suiteKey = String(suite.id)
    allKeys.push(suiteKey)

    if (suite.children.length) {
      const [children] = suitesFilterFormat(suite.children, [], allKeys)
      newList.push({
        ...suite,
        key: suiteKey,
        value: suiteKey,
        children,
      })
    } else {
      newList.push({
        ...suite,
        key: suiteKey,
        value: suiteKey,
        children: [],
      })
    }
  }

  return [newList, allKeys]
}

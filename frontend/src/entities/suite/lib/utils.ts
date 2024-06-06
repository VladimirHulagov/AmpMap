export const testSuiteSearchValueFormat = (item: CopySuiteResponse) => {
  return item.path.split("/").join(" / ")
}

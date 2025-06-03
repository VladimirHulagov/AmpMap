export const formatStatistics = (statistics: TestPlanStatistics[]) => {
  return statistics.map((status) => ({
    id: status.id,
    name: status.label,
    fill: status.color,
    value: status.value,
  }))
}

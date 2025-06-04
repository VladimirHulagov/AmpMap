import { ReactNode, createContext, useContext } from "react"

import { LazyNodeProps, TreeNodeUpdate } from "shared/libs/tree"

interface TestPlanStatisticsContextType {
  childStatistics?: Record<string, ChildStatisticData>
  isLoading: boolean
  onUpdate?: (data: TreeNodeUpdate<Test | TestPlan, LazyNodeProps>[]) => void
}

const TestPlanStatisticsContext = createContext<TestPlanStatisticsContextType | undefined>(
  undefined
)

interface TestPlanStatisticsProviderProps {
  children: ReactNode
  value: TestPlanStatisticsContextType
}

export const TestPlanStatisticsProvider = ({
  children,
  value,
}: TestPlanStatisticsProviderProps) => {
  return (
    <TestPlanStatisticsContext.Provider value={value}>
      {children}
    </TestPlanStatisticsContext.Provider>
  )
}

export const useTestPlanStatisticsContext = () => {
  const context = useContext(TestPlanStatisticsContext)
  if (context === undefined) {
    throw new Error("useTestPlanStatisticsContext must be used within a TestPlanStatisticsProvider")
  }
  return context
}

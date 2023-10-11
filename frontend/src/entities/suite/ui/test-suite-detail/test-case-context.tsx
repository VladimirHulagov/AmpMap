import React from "react"

export type TestCaseIdContextType = {
  testCaseId: Id | null
  setTestCaseId: React.Dispatch<React.SetStateAction<number | null>>
}

export const TestCaseIdContext = React.createContext<TestCaseIdContextType | null>(null)

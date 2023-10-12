import { useContext, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useSearchParams } from "react-router-dom"

import { useAppDispatch } from "app/hooks"

import {
  TestCaseIdContext,
  TestCaseIdContextType,
} from "entities/suite/ui/test-suite-detail/test-case-context"

import { clearTestCase, setTestCase } from "entities/test-case/model"

import { useGetTestCaseByIdQuery, useLazyGetTestCaseByVersionQuery } from "../api"

interface UseTestCaseDetailProps {
  testCaseId: number
}

export const useTestCaseDetail = ({ testCaseId }: UseTestCaseDetailProps) => {
  const dispatch = useAppDispatch()
  const { data: testCaseById, isLoading: isLoadingTestCaseById } =
    useGetTestCaseByIdQuery(testCaseId)
  const [getTestCaseByVersion, { data: testCaseByVersion }] = useLazyGetTestCaseByVersionQuery()
  const { setTestCaseId } = useContext(TestCaseIdContext) as TestCaseIdContextType
  const [showVersion, setShowVersion] = useState<number | null>(null)
  const { control } = useForm()
  const [showTestCase, setShowTestCase] = useState<TestCase | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (!searchParams.get("version")) return
    const version = searchParams.get("version")
    if (!version) return
    ;(async () => {
      await getTestCaseByVersion({ testCaseId, version })
      setShowVersion(Number(version))
    })()
  }, [searchParams.get("version")])

  useEffect(() => {
    if (testCaseById) {
      setShowVersion(testCaseById.current_version)
      setShowTestCase(testCaseById)
      dispatch(setTestCase(testCaseById))
    }
  }, [testCaseById])

  useEffect(() => {
    if (!testCaseByVersion) return
    dispatch(setTestCase(testCaseByVersion))
    setShowTestCase(testCaseByVersion)
  }, [testCaseByVersion])

  const versionData = useMemo(() => {
    if (!testCaseById) return []
    return testCaseById.versions.map((item) => ({
      value: item,
      label: `ver. ${item}`,
    }))
  }, [testCaseById])

  const handleClose = () => {
    setTestCaseId(null)
    searchParams.delete("test_case")
    setSearchParams(searchParams)
    dispatch(clearTestCase())
  }

  const handleChange = async (value: number) => {
    setShowVersion(value)
    await getTestCaseByVersion({ testCaseId, version: String(value) })
    setSearchParams({ version: String(value), test_case: String(testCaseId) })
  }

  return {
    showTestCase,
    isLoadingTestCaseById,
    showVersion,
    versionData,
    control,
    handleClose,
    handleChange,
  }
}

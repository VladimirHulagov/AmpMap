import { Modal, notification } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useSearchParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useLazyGetTestCaseByIdQuery, useRestoreTestCaseMutation } from "entities/test-case/api"
import { selectDrawerTestCase, setDrawerTestCase } from "entities/test-case/model"

import { initInternalError } from "shared/libs"
import { AlertSuccessChange } from "shared/ui"

interface UseTestCaseDetailProps {
  testCase: TestCase | null
  onClose: () => void
}

export const useTestCaseDetail = ({ testCase, onClose }: UseTestCaseDetailProps) => {
  const dispatch = useAppDispatch()
  const selectedTestCase = useAppSelector(selectDrawerTestCase)
  const [getTestCase, { data: testCaseData }] = useLazyGetTestCaseByIdQuery()
  const [restoreTestCase] = useRestoreTestCaseMutation()
  const [showVersion, setShowVersion] = useState<number | null>(null)
  const { control } = useForm()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if ((!searchParams.get("version") && !searchParams.get("test_case")) || selectedTestCase) {
      return
    }
    const version = searchParams.get("version")
    const testCaseId = searchParams.get("test_case")
    if (!testCaseId) {
      return
    }

    const fetch = async () => {
      await getTestCase({ testCaseId: String(testCaseId), version: version ?? undefined })
      setShowVersion(Number(version))
    }
    fetch()
  }, [searchParams.get("version"), searchParams.get("test_case"), selectedTestCase])

  useEffect(() => {
    if (!searchParams.get("test_case") && selectedTestCase) {
      dispatch(setDrawerTestCase(null))
    }
  }, [searchParams.get("test_case"), selectedTestCase])

  useEffect(() => {
    if (!testCase) {
      return
    }
    setShowVersion(testCase.current_version)
    dispatch(setDrawerTestCase(testCase))
  }, [testCase])

  useEffect(() => {
    if (!testCaseData) {
      return
    }
    dispatch(setDrawerTestCase(testCaseData))
  }, [testCaseData])

  const versionData = useMemo(() => {
    if (!testCase?.versions) {
      return []
    }
    const sorted = [...testCase.versions].sort((a, b) => b - a)
    return sorted.map((item) => ({
      value: item,
      label: `ver. ${item}`,
    }))
  }, [testCase])

  const handleClose = () => {
    searchParams.delete("test_case")
    searchParams.delete("version")
    setSearchParams(searchParams)
    onClose()
    dispatch(setDrawerTestCase(null))
  }

  const handleChange = async (value: number) => {
    setShowVersion(value)
    await getTestCase({ testCaseId: String(testCase?.id), version: String(value) })
    setSearchParams({ version: String(value), test_case: String(testCase?.id) })
  }

  const handleRestoreVersion = () => {
    if (!showVersion || !testCase) return
    Modal.confirm({
      title: "Do you want to restore this version of test case?",
      okText: "Restore",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const res = await restoreTestCase({
            testCaseId: testCase.id,
            version: showVersion,
          }).unwrap()
          setSearchParams({ version: String(res.versions[0]), test_case: String(testCase.id) })
          notification.success({
            message: "Success",
            description: (
              <AlertSuccessChange
                id={String(testCase.id)}
                action="restore"
                title="Test Case"
                link={`/projects/${testCase.project}/suites/${testCase.suite}?version=${res.versions[0]}&test_case=${testCase.id}`}
              />
            ),
          })
        } catch (err: unknown) {
          initInternalError(err)
        }
      },
    })
  }

  return {
    showVersion,
    versionData,
    control,
    handleClose,
    handleChange,
    handleRestoreVersion,
  }
}

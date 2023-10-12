import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { notification } from "antd"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { useCopyTestCaseMutation } from "entities/test-case/api"

import { AlertSuccessChange } from "shared/ui/alert-success-change"

export const useTestCaseCopyModal = (testCase: TestCase) => {
  const { testSuiteId } = useParams<ParamTestSuiteId>()
  const [isShow, setIsShow] = useState(false)
  const [copyTestCase, { isLoading }] = useCopyTestCaseMutation()
  const [newName, setNewName] = useState(testCase.name)
  const [selectedSuite, setSelectedSuite] = useState<{ label: string; value: number } | null>(null)

  const handleCancel = () => {
    setIsShow(false)
    setSelectedSuite(null)
  }

  const handleShow = () => {
    setIsShow(true)
  }

  const handleSave = async () => {
    try {
      await copyTestCase({
        cases: [{ id: String(testCase.id), new_name: newName }],
        dst_suite_id: selectedSuite ? String(selectedSuite.value) : testSuiteId ? testSuiteId : "",
      })
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange id={String(testCase.id)} action="copied" title="Test Case" />
        ),
      })
      handleCancel()
    } catch (err) {
      const error = err as FetchBaseQueryError

      console.error(error)
      notification.error({
        message: "Error!",
        description: "Internal server error. Showing in console log.",
      })
    }
  }

  const handleChange = (value?: { label: string; value: number }) => {
    if (value) {
      setSelectedSuite(value)
    }
  }

  const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value)
  }

  const handleClear = () => {
    setSelectedSuite(null)
  }

  useEffect(() => {
    if (!isShow) return
    setNewName(`${testCase.name}(Copy)`)
  }, [testCase, isShow])

  return {
    handleCancel,
    handleShow,
    handleSave,
    handleChange,
    handleClear,
    isShow,
    isLoading,
    selectedSuite,
    newName,
    handleChangeName,
  }
}

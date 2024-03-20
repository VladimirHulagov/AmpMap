import { notification } from "antd"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { useCopyTestCaseMutation } from "entities/test-case/api"

import { initInternalError } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

export const useTestCaseCopyModal = (testCase: TestCase) => {
  const { testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
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
      const dstSuiteId = testSuiteId ?? ""
      await copyTestCase({
        cases: [{ id: String(testCase.id), new_name: newName }],
        dst_suite_id: selectedSuite ? String(selectedSuite.value) : dstSuiteId,
      })
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange id={String(testCase.id)} action="copied" title="Test Case" />
        ),
      })
      handleCancel()
    } catch (err) {
      initInternalError(err)
    }
  }

  const handleSelectSuite = (value?: SelectData | null) => {
    if (value) {
      setSelectedSuite(value)
    }
  }

  const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value)
  }

  const handleClearSelected = () => {
    setSelectedSuite(null)
  }

  useEffect(() => {
    if (!isShow) return
    setNewName(`${testCase.name}(Copy)`)
  }, [testCase, isShow])

  return {
    isShow,
    isLoading,
    selectedSuite,
    newName,
    handleChangeName,
    handleClearSelected,
    handleSelectSuite,
    handleSave,
    handleShow,
    handleCancel,
  }
}

import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { notification } from "antd"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { useGetTestSuitesQuery } from "entities/suite/api"

import { useCopyTestCaseMutation } from "entities/test-case/api"

import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { useSearchField } from "widgets/search-field"

export const useTestCaseCopyModal = (testCase: TestCase) => {
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const [isShow, setIsShow] = useState(false)
  const [copyTestCase, { isLoading }] = useCopyTestCaseMutation()
  const [newName, setNewName] = useState(testCase.name)
  const [selectedSuite, setSelectedSuite] = useState<{ label: string; value: number } | null>(null)
  const { search, paginationParams, handleSearch, handleLoadNextPageData } = useSearchField()
  const { data: dataTestSuites, isLoading: isLoadingTestSuites } = useGetTestSuitesQuery(
    {
      search,
      project: projectId,
      page: paginationParams.page,
      page_size: paginationParams.page_size,
      is_flat: true,
    },
    {
      skip: !projectId || search === undefined,
    }
  )

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
    isShow,
    isLoading,
    selectedSuite,
    newName,
    dataTestSuites,
    isLoadingTestSuites,
    handleSearch,
    handleLoadNextPageData,
    handleChangeName,
    handleClear,
    handleChange,
    handleSave,
    handleShow,
    handleCancel,
  }
}

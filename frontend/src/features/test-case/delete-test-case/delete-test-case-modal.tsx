import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { notification } from "antd"
import { useNavigate } from "react-router-dom"

import { useDeleteTestCaseMutation, useGetTestCaseDeletePreviewQuery } from "entities/test-case/api"

import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { ModalConfirmDeleteArchive } from "widgets/[ui]/modal-confirm-delete-archive"

interface Props {
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  testCase: TestCase
}

export const DeleteTestCaseModal = ({ isShow, setIsShow, testCase }: Props) => {
  const [deleteTestCase, { isLoading: isLoadingDelete }] = useDeleteTestCaseMutation()
  const { data, isLoading } = useGetTestCaseDeletePreviewQuery(String(testCase.id), {
    skip: !isShow,
  })
  const navigate = useNavigate()

  const handleClose = () => {
    setIsShow(false)
  }

  const handleDelete = async () => {
    try {
      await deleteTestCase(testCase.id).unwrap()
      navigate(`/projects/${testCase.project}/suites/${testCase.suite}`)
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange id={String(testCase.id)} action="deleted" title="Test Case" />
        ),
      })
    } catch (err: unknown) {
      const error = err as FetchBaseQueryError

      console.error(error)
      notification.error({
        message: "Error!",
        description: "Internal server error. Showing in console log.",
      })
    }

    handleClose()
  }

  return (
    <ModalConfirmDeleteArchive
      isShow={isShow}
      isLoading={isLoading}
      isLoadingButton={isLoadingDelete}
      name={testCase.name}
      typeTitle="Test Case"
      type="test-case"
      data={data || []}
      handleClose={handleClose}
      handleDelete={handleDelete}
      action="delete"
    />
  )
}

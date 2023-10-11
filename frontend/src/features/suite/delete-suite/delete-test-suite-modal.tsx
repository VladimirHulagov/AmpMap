import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { notification } from "antd"
import { useNavigate } from "react-router-dom"

import { useDeleteTestSuiteMutation, useGetSuiteDeletePreviewQuery } from "entities/suite/api"

import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { ModalConfirmDeleteArchive } from "widgets/[ui]/modal-confirm-delete-archive"

interface Props {
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  testSuite: ISuite
}

export const DeleteTestSuiteModal = ({ isShow, setIsShow, testSuite }: Props) => {
  const [deleteTestSuite, { isLoading: isLoadingDelete }] = useDeleteTestSuiteMutation()
  const { data, isLoading } = useGetSuiteDeletePreviewQuery(String(testSuite.id), {
    skip: !isShow,
  })
  const navigate = useNavigate()

  const handleClose = () => {
    setIsShow(false)
  }

  const handleDelete = async () => {
    try {
      await deleteTestSuite(testSuite.id).unwrap()
      navigate(`/projects/${testSuite.project}/suites`)
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange id={String(testSuite.id)} action="deleted" title="Test Suite" />
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
  }

  return (
    <ModalConfirmDeleteArchive
      isShow={isShow}
      isLoading={isLoading}
      isLoadingButton={isLoadingDelete}
      name={testSuite.name}
      typeTitle="Test Suite"
      type="test-suite"
      data={data || []}
      handleClose={handleClose}
      handleDelete={handleDelete}
      action="delete"
    />
  )
}

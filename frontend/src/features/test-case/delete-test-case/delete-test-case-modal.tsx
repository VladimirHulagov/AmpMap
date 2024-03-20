import { notification } from "antd"
import { useNavigate } from "react-router-dom"

import { useDeleteTestCaseMutation, useGetTestCaseDeletePreviewQuery } from "entities/test-case/api"

import { initInternalError } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { ModalConfirmDeleteArchive } from "widgets/[ui]/modal-confirm-delete-archive"

interface Props {
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  testCase: TestCase
}

export const DeleteTestCaseModal = ({ isShow, setIsShow, testCase }: Props) => {
  const [deleteTestCase, { isLoading: isLoadingDelete }] = useDeleteTestCaseMutation()
  const { data, isLoading, status } = useGetTestCaseDeletePreviewQuery(String(testCase.id), {
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
      initInternalError(err)
    }

    handleClose()
  }

  return (
    <ModalConfirmDeleteArchive
      status={status}
      isShow={isShow}
      isLoading={isLoading}
      isLoadingButton={isLoadingDelete}
      name={testCase.name}
      typeTitle="Test Case"
      type="test-case"
      data={data ?? []}
      handleClose={handleClose}
      handleDelete={handleDelete}
      action="delete"
    />
  )
}

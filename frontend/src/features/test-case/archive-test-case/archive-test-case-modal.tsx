import { notification } from "antd"
import { useNavigate } from "react-router-dom"

import {
  useArchiveTestCaseMutation,
  useGetTestCaseArchivePreviewQuery,
} from "entities/test-case/api"

import { initInternalError } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { ModalConfirmDeleteArchive } from "widgets/[ui]"

interface Props {
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  testCase: TestCase
}

export const ArchiveTestCaseModal = ({ isShow, setIsShow, testCase }: Props) => {
  const [archiveTestCase, { isLoading: isLoadingDelete }] = useArchiveTestCaseMutation()
  const { data, isLoading, status } = useGetTestCaseArchivePreviewQuery(String(testCase.id), {
    skip: !isShow,
  })
  const navigate = useNavigate()

  const handleClose = () => {
    setIsShow(false)
  }

  const handleDelete = async () => {
    try {
      await archiveTestCase(testCase.id).unwrap()
      navigate(`/projects/${testCase.project}/suites/${testCase.suite}`)
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange id={String(testCase.id)} action="archived" title="Test Case" />
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
      action="archive"
    />
  )
}

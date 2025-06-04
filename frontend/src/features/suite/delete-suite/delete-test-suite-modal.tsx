import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { useDeleteTestSuiteMutation, useGetSuiteDeletePreviewQuery } from "entities/suite/api"

import { initInternalError } from "shared/libs"
import { antdNotification } from "shared/libs/antd-modals"
import { AlertSuccessChange } from "shared/ui"

import { ModalConfirmDeleteArchive } from "widgets/[ui]/modal-confirm-delete-archive"

interface Props {
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  testSuite: Suite
  onSubmit?: (suite: Suite) => void
}

export const DeleteTestSuiteModal = ({ isShow, setIsShow, testSuite, onSubmit }: Props) => {
  const { t } = useTranslation()
  const [deleteTestSuite, { isLoading: isLoadingDelete }] = useDeleteTestSuiteMutation()
  const { data, isLoading, status } = useGetSuiteDeletePreviewQuery(String(testSuite.id), {
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
      antdNotification.success("delete-test-suite", {
        description: (
          <AlertSuccessChange
            id={String(testSuite.id)}
            action="deleted"
            title={t("Test Suite")}
            data-testid="delete-test-suite-success-notification-description"
          />
        ),
      })
      onSubmit?.(testSuite)
    } catch (err: unknown) {
      initInternalError(err)
    }
  }

  return (
    <ModalConfirmDeleteArchive
      status={status}
      isShow={isShow}
      isLoading={isLoading}
      isLoadingButton={isLoadingDelete}
      name={testSuite.name}
      typeTitle={t("Test Suite")}
      type="test-suite"
      data={data ?? []}
      handleClose={handleClose}
      handleDelete={handleDelete}
      action="delete"
    />
  )
}

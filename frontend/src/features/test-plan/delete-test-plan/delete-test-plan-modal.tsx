import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { useDeleteTestPlanMutation, useGetTestPlanDeletePreviewQuery } from "entities/test-plan/api"

import { initInternalError } from "shared/libs"
import { antdNotification } from "shared/libs/antd-modals"
import { AlertSuccessChange } from "shared/ui"

import { ModalConfirmDeleteArchive } from "widgets/[ui]/modal-confirm-delete-archive"

interface Props {
  isShow: boolean
  setIsShow: (toggle: boolean) => void
  testPlan: TestPlan
  onSubmit?: (plan: TestPlan) => void
}

export const DeleteTestPlanModal = ({ isShow, setIsShow, testPlan, onSubmit }: Props) => {
  const { t } = useTranslation()
  const { testPlanId } = useParams<ParamTestPlanId>()
  const [deleteTestPlan, { isLoading: isLoadingDelete }] = useDeleteTestPlanMutation()
  const { data, isLoading, status } = useGetTestPlanDeletePreviewQuery(String(testPlan.id), {
    skip: !isShow,
  })

  const navigate = useNavigate()

  const handleClose = () => {
    setIsShow(false)
  }

  const handleDelete = async () => {
    try {
      await deleteTestPlan(testPlan.id).unwrap()
      antdNotification.success("delete-test-plan", {
        description: (
          <AlertSuccessChange
            id={String(testPlan.id)}
            action="deleted"
            title={t("Test Plan")}
            data-testid="delete-test-plan-success-notification-description"
          />
        ),
        props: {
          "data-testid": "delete-test-plan-success-notification",
        },
      })
      onSubmit?.(testPlan)
      if (testPlanId && testPlan.id === Number(testPlanId)) {
        navigate(`/projects/${testPlan.project}/plans`)
      }
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
      name={testPlan.name}
      typeTitle={t("Test Plan")}
      type="test-plan"
      data={data ?? []}
      handleClose={handleClose}
      handleDelete={handleDelete}
      action="delete"
    />
  )
}

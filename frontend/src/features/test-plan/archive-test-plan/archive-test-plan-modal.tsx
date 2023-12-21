import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { notification } from "antd"
import { useNavigate } from "react-router-dom"

import {
  useArchiveTestPlanMutation,
  useGetTestPlanArchivePreviewQuery,
} from "entities/test-plan/api"

import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { ModalConfirmDeleteArchive } from "widgets/[ui]/modal-confirm-delete-archive"

interface Props {
  isShow: boolean
  setIsShow: (toggle: boolean) => void
  testPlan: TestPlanTreeView
}

export const ArchiveTestPlanModal = ({ isShow, setIsShow, testPlan }: Props) => {
  const [archiveTestPlan, { isLoading: isLoadingDelete }] = useArchiveTestPlanMutation()
  const { data, isLoading, status } = useGetTestPlanArchivePreviewQuery(String(testPlan.id), {
    skip: !isShow,
  })

  const navigate = useNavigate()

  const handleClose = () => {
    setIsShow(false)
  }

  const handleArchive = async () => {
    try {
      await archiveTestPlan(testPlan.id).unwrap()
      navigate(`/projects/${testPlan.project}/plans`)
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange id={String(testPlan.id)} action="archived" title="Test Plan" />
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
      status={status}
      isShow={isShow}
      isLoading={isLoading}
      isLoadingButton={isLoadingDelete}
      name={testPlan.name}
      typeTitle="Test Plan"
      type="test-plan"
      data={data ?? []}
      handleClose={handleClose}
      handleDelete={handleArchive}
      action="archive"
    />
  )
}

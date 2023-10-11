import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { notification } from "antd"
import { useNavigate } from "react-router-dom"

import { useDeleteTestPlanMutation, useGetTestPlanDeletePreviewQuery } from "entities/test-plan/api"

import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { ModalConfirmDeleteArchive } from "widgets/[ui]/modal-confirm-delete-archive"

interface Props {
  isShow: boolean
  setIsShow: (toggle: boolean) => void
  testPlan: ITestPlanTreeView
}

export const DeleteTestPlanModal = ({ isShow, setIsShow, testPlan }: Props) => {
  const [deleteTestPlan, { isLoading: isLoadingDelete }] = useDeleteTestPlanMutation()
  const { data, isLoading } = useGetTestPlanDeletePreviewQuery(String(testPlan.id), {
    skip: !isShow,
  })

  const navigate = useNavigate()

  const handleClose = () => {
    setIsShow(false)
  }

  const handleDelete = async () => {
    try {
      await deleteTestPlan(testPlan.id).unwrap()
      navigate(`/projects/${testPlan.project}/plans`)
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange id={String(testPlan.id)} action="deleted" title="Test Plan" />
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
      name={testPlan.name}
      typeTitle="Test Plan"
      type="test-plan"
      data={data || []}
      handleClose={handleClose}
      handleDelete={handleDelete}
      action="delete"
    />
  )
}

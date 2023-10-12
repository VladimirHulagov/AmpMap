import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { notification } from "antd"

import { useArchiveProjectMutation, useGetProjectArchivePreviewQuery } from "entities/project/api"

import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { ModalConfirmDeleteArchive } from "widgets/[ui]/modal-confirm-delete-archive"

interface Props {
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  project: Project
}

export const ArchiveProjectModal = ({ isShow, setIsShow, project }: Props) => {
  const [archiveProject, { isLoading: isLoadingArchive }] = useArchiveProjectMutation()
  const { data, isLoading } = useGetProjectArchivePreviewQuery(String(project.id), {
    skip: !isShow,
  })

  const handleClose = () => {
    setIsShow(false)
  }

  const handleDelete = async () => {
    try {
      await archiveProject(Number(project.id))
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange id={String(project.id)} action="archived" title="Project" />
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
      isLoadingButton={isLoadingArchive}
      name={project.name}
      typeTitle="Project"
      type="project"
      data={data || []}
      handleClose={handleClose}
      handleDelete={handleDelete}
      action="archive"
    />
  )
}

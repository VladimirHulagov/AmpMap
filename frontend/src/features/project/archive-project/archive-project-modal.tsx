import { notification } from "antd"

import { useArchiveProjectMutation, useGetProjectArchivePreviewQuery } from "entities/project/api"

import { initInternalError } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { ModalConfirmDeleteArchive } from "widgets/[ui]/modal-confirm-delete-archive"

interface Props {
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  project: Project
}

export const ArchiveProjectModal = ({ isShow, setIsShow, project }: Props) => {
  const [archiveProject, { isLoading: isLoadingArchive }] = useArchiveProjectMutation()
  const { data, isLoading, status } = useGetProjectArchivePreviewQuery(String(project.id), {
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
      initInternalError(err)
    }

    handleClose()
  }

  return (
    <ModalConfirmDeleteArchive
      status={status}
      isShow={isShow}
      isLoading={isLoading}
      isLoadingButton={isLoadingArchive}
      name={project.name}
      typeTitle="Project"
      type="project"
      data={data ?? []}
      handleClose={handleClose}
      handleDelete={handleDelete}
      action="archive"
    />
  )
}

import { Button, Form, Input, Modal, Switch, notification } from "antd"
import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"

import { useAppSelector } from "app/hooks"

import { useCreateProjectMutation, useUpdateProjectMutation } from "entities/project/api"
import {
  hideModal,
  selectModalIsEditMode,
  selectModalIsShow,
  selectProject,
} from "entities/project/model"

import { useErrors } from "shared/hooks"
import { showModalCloseConfirm } from "shared/libs"
import { AlertError } from "shared/ui"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

const { TextArea } = Input

type ErrorData = {
  name?: string
  description?: string
  is_archive?: string
}

export const CreateEditProjectModal = () => {
  const dispatch = useDispatch()
  const isShow = useAppSelector(selectModalIsShow)
  const isEditMode = useAppSelector(selectModalIsEditMode)
  const project = useSelector(selectProject)
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<IProject>()
  const [createProject, { isLoading }] = useCreateProjectMutation()
  const [updateProject] = useUpdateProjectMutation()
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const is_archive = watch("is_archive")

  useEffect(() => {
    if (isEditMode && project) {
      setValue("name", project.name)
      setValue("description", project.description)
      setValue("is_archive", project.is_archive)
    } else {
      setValue("is_archive", false)
    }
  }, [isEditMode, project])

  const onSubmit: SubmitHandler<IProject> = async (data) => {
    setErrors(null)

    try {
      let newProject: IProject | null = null

      if (isEditMode && project) {
        newProject = await updateProject({ id: project.id, body: data }).unwrap()
      } else {
        newProject = await createProject(data).unwrap()
      }

      onCloseModal()
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            action={isEditMode ? "updated" : "created"}
            title="Project"
            link={`/projects/${newProject.id}`}
            id={String(newProject.id)}
          />
        ),
      })
    } catch (err) {
      onHandleError(err)
    }
  }

  const onCloseModal = () => {
    dispatch(hideModal())
    setErrors(null)
    reset()
  }

  const handleCancel = () => {
    if (isLoading) return

    if (isDirty) {
      showModalCloseConfirm(onCloseModal)
      return
    }

    onCloseModal()
  }

  const title = isEditMode ? `Edit Project '${project?.name}'` : "Create Project"

  return (
    <Modal
      className="create-edit-project-modal"
      title={title}
      open={isShow}
      onCancel={handleCancel}
      width="600px"
      centered
      footer={[
        <Button id="close-create-update-project" key="back" onClick={handleCancel}>
          Close
        </Button>,
        <Button
          id="create-update-project"
          loading={isLoading}
          key="submit"
          onClick={handleSubmit(onSubmit)}
          type="primary"
          disabled={!isDirty}
        >
          {isEditMode ? "Update" : "Create"}
        </Button>,
      ]}
    >
      <>
        {errors ? (
          <AlertError error={errors} skipFields={["name", "description", "is_archive"]} />
        ) : null}

        <Form id="create-edit-project-form" layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label="Name"
            validateStatus={errors?.name ? "error" : ""}
            help={errors?.name ? errors.name : ""}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item
            label="Description"
            validateStatus={errors?.description ? "error" : ""}
            help={errors?.description ? errors.description : ""}
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => <TextArea rows={4} {...field} />}
            />
          </Form.Item>
          {isEditMode ? (
            <Form.Item
              label="Archive"
              validateStatus={errors?.is_archive ? "error" : ""}
              help={errors?.is_archive ? errors.is_archive : ""}
            >
              <Controller
                name="is_archive"
                control={control}
                render={({ field }) => <Switch checked={is_archive} {...field} />}
              />
            </Form.Item>
          ) : null}
        </Form>
      </>
    </Modal>
  )
}

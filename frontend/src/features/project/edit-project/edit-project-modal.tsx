import { Button, Form, Input, Modal, Switch, Upload, notification } from "antd"
import { RcFile, UploadChangeParam, UploadFile } from "antd/lib/upload"
import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"

import { useUpdateProjectMutation } from "entities/project/api"
import { ProjectIcon } from "entities/project/ui"

import { useErrors } from "shared/hooks"
import { ErrorObj } from "shared/hooks/use-alert-error"
import { fileReader, showModalCloseConfirm } from "shared/libs"
import { AlertError } from "shared/ui"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

const { TextArea } = Input

interface ErrorData {
  name?: string
  description?: string
  is_archive?: string
  is_private?: string
}

interface Props {
  project: Project
  isShow: boolean
  setIsShow: (isShow: boolean) => void
}

export const EditProjectModal = ({ isShow, setIsShow, project }: Props) => {
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<Project>()
  const [updateProject, { isLoading }] = useUpdateProjectMutation()
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const is_archive = watch("is_archive")
  const nameWatch = watch("name")
  const isPrivate = watch("is_private")
  const [localIcon, setLocalIcon] = useState<string | null>(null)

  useEffect(() => {
    setValue("name", project.name)
    setValue("description", project.description)
    setValue("is_archive", project.is_archive)
    setLocalIcon(project.icon ?? null)
    setValue("is_private", project.is_private ?? false)
  }, [isShow, project])

  const onSubmit: SubmitHandler<Project> = async (data) => {
    setErrors(null)

    try {
      const fmData = new FormData()

      fmData.append("name", data.name)
      fmData.append("description", data.description)
      fmData.append("is_archive", String(data.is_archive))

      if (data.icon !== undefined) {
        fmData.append("icon", data.icon ?? "")
      }
      if (project.is_manageable) {
        fmData.append("is_private", String(data.is_private))
      }
      const newProject = await updateProject({ id: project.id, body: fmData }).unwrap()

      onCloseModal()
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            action="updated"
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
    setIsShow(false)
    setErrors(null)
    setLocalIcon(null)
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

  const onChange = async (info: UploadChangeParam<UploadFile<unknown>>) => {
    if (!info.file.originFileObj) return
    const file = await fileReader(info.file)
    setLocalIcon(file.url)
    setValue("icon", file.file as unknown as string, {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  const beforeUpload = (file: RcFile) => {
    const isCorrectType = file.type === "image/png" || file.type === "image/jpeg"
    if (!isCorrectType) {
      notification.error({
        message: "Error!",
        description: `${file.name} is not a png or jpg file`,
      })
    }

    return isCorrectType || Upload.LIST_IGNORE
  }

  const handleDeleteIconClick = () => {
    setLocalIcon(null)
    setValue("icon", "", { shouldDirty: true, shouldTouch: true })
  }

  return (
    <Modal
      className="edit-project-modal"
      title={`Edit Project '${project.name}'`}
      open={isShow}
      onCancel={handleCancel}
      width="600px"
      centered
      footer={[
        <Button id="close-update-project" key="back" onClick={handleCancel}>
          Close
        </Button>,
        <Button
          id="update-project"
          loading={isLoading}
          key="submit"
          onClick={handleSubmit(onSubmit)}
          type="primary"
          disabled={!isDirty}
        >
          Update
        </Button>,
      ]}
    >
      <>
        {errors ? (
          <AlertError
            error={errors as ErrorObj}
            skipFields={["name", "description", "is_archive", "is_private"]}
          />
        ) : null}

        <Form id="create-edit-project-form" layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label="Icon">
            <Controller
              name="icon"
              control={control}
              render={() => {
                return (
                  <div
                    style={{ display: "flex", alignItems: "center", flexDirection: "row", gap: 14 }}
                  >
                    <ProjectIcon name={nameWatch} icon={localIcon} />
                    <Upload
                      name="avatar"
                      showUploadList={false}
                      onChange={onChange}
                      style={{ width: 180 }}
                      customRequest={() => {}}
                      beforeUpload={beforeUpload}
                    >
                      <Button size="middle">Upload icon</Button>
                    </Upload>
                    {localIcon && (
                      <Button size="middle" danger onClick={handleDeleteIconClick}>
                        Delete icon
                      </Button>
                    )}
                  </div>
                )
              }}
            />
          </Form.Item>
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
          {project.is_manageable && (
            <Form.Item
              label="Private"
              validateStatus={errors?.is_private ? "error" : ""}
              help={errors?.is_private ? errors.is_private : ""}
            >
              <Controller
                name="is_private"
                control={control}
                render={({ field }) => <Switch checked={isPrivate} {...field} />}
              />
            </Form.Item>
          )}
        </Form>
      </>
    </Modal>
  )
}

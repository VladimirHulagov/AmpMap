import { Form, Input, Modal, Switch, Upload } from "antd"
import { RcFile, UploadChangeParam, UploadFile } from "antd/lib/upload"
import { useMeContext } from "processes"
import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useUpdateProjectMutation } from "entities/project/api"
import { ProjectIcon } from "entities/project/ui"

import { ErrorObj, useErrors } from "shared/hooks"
import { fileReader } from "shared/libs"
import { antdModalCloseConfirm, antdNotification } from "shared/libs/antd-modals"
import { AlertError, AlertSuccessChange, Button, TextArea } from "shared/ui"

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

const TEST_ID = "edit-project"

export const EditProjectModal = ({ isShow, setIsShow, project }: Props) => {
  const { t } = useTranslation()
  const { me } = useMeContext()
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
    setLocalIcon(project.icon ?? null)
    setValue("is_private", project.is_private ?? false)

    if (me?.is_superuser) {
      setValue("is_archive", project.is_archive)
    }
  }, [isShow, project, me])

  const onSubmit: SubmitHandler<Project> = async (data) => {
    setErrors(null)

    try {
      const fmData = new FormData()

      fmData.append("name", data.name)
      fmData.append("description", data.description)
      if (me?.is_superuser) {
        fmData.append("is_archive", String(data.is_archive))
      }

      if (data.icon !== undefined) {
        fmData.append("icon", data.icon ?? "")
      }
      if (project.is_manageable) {
        fmData.append("is_private", String(data.is_private))
      }
      const newProject = await updateProject({ id: project.id, body: fmData }).unwrap()

      onCloseModal()
      antdNotification.success("edit-project", {
        description: (
          <AlertSuccessChange
            action="updated"
            title={t("Project")}
            link={`/projects/${newProject.id}/overview/`}
            id={String(newProject.id)}
            data-testid="edit-project-success-notification-description"
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
      antdModalCloseConfirm(onCloseModal)
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
      antdNotification.error("edit-project", {
        description: `${file.name} ${t("is not a png or jpg file")}`,
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
      bodyProps={{ "data-testid": `${TEST_ID}-modal-body` }}
      wrapProps={{ "data-testid": `${TEST_ID}-modal-wrapper` }}
      title={
        <span
          data-testid={`${TEST_ID}-modal-title`}
        >{`${t("Edit Project")} '${project.name}'`}</span>
      }
      open={isShow}
      onCancel={handleCancel}
      width="600px"
      centered
      footer={[
        <Button
          id="close-update-project"
          key="back"
          onClick={handleCancel}
          color="secondary-linear"
        >
          {t("Close")}
        </Button>,
        <Button
          id="update-project"
          loading={isLoading}
          key="submit"
          onClick={handleSubmit(onSubmit)}
          color="accent"
          disabled={!isDirty}
        >
          {t("Update")}
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
          <Form.Item label={t("Icon")}>
            <Controller
              name="icon"
              control={control}
              render={() => {
                return (
                  <div
                    style={{ display: "flex", alignItems: "center", flexDirection: "row", gap: 14 }}
                  >
                    <ProjectIcon name={nameWatch} icon={localIcon} dataTestId="edit-project-icon" />
                    <Upload
                      name="avatar"
                      showUploadList={false}
                      onChange={onChange}
                      style={{ width: 180 }}
                      customRequest={() => {}}
                      beforeUpload={beforeUpload}
                      data-testid="edit-project-upload-icon-input"
                    >
                      <Button
                        color="secondary-linear"
                        data-testid="edit-project-upload-icon-button"
                      >
                        {t("Upload icon")}
                      </Button>
                    </Upload>
                    {localIcon && (
                      <Button
                        danger
                        color="secondary-linear"
                        onClick={handleDeleteIconClick}
                        data-testid="edit-project-delete-icon-button"
                      >
                        {t("Delete icon")}
                      </Button>
                    )}
                  </div>
                )
              }}
            />
          </Form.Item>
          <Form.Item
            label={t("Name")}
            validateStatus={errors?.name ? "error" : ""}
            help={errors?.name ? errors.name : ""}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} data-testid="edit-project-name" />}
            />
          </Form.Item>
          <Form.Item
            label={t("Description")}
            validateStatus={errors?.description ? "error" : ""}
            help={errors?.description ? errors.description : ""}
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea rows={4} data-testid="edit-project-description" {...field} />
              )}
            />
          </Form.Item>
          {me?.is_superuser && (
            <Form.Item
              label={t("Archive")}
              validateStatus={errors?.is_archive ? "error" : ""}
              help={errors?.is_archive ? errors.is_archive : ""}
            >
              <Controller
                name="is_archive"
                control={control}
                render={({ field }) => (
                  <Switch checked={is_archive} {...field} data-testid="edit-project-is-archive" />
                )}
              />
            </Form.Item>
          )}
          {project.is_manageable && (
            <Form.Item
              label={t("Private")}
              validateStatus={errors?.is_private ? "error" : ""}
              help={errors?.is_private ? errors.is_private : ""}
            >
              <Controller
                name="is_private"
                control={control}
                render={({ field }) => (
                  <Switch checked={isPrivate} {...field} data-testid="edit-project-is-private" />
                )}
              />
            </Form.Item>
          )}
        </Form>
      </>
    </Modal>
  )
}

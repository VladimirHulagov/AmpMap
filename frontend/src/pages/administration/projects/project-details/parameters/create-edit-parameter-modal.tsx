import { Button, Form, Input, Modal, notification } from "antd"
import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useDispatch, useSelector } from "react-redux"

import { useAppSelector } from "app/hooks"

import { useCreateParameterMutation, useUpdateParameterMutation } from "entities/parameter/api"
import {
  hideModal,
  selectModalIsEditMode,
  selectModalIsShow,
  selectParameter,
} from "entities/parameter/model"

import { ErrorObj, useErrors, useShowModalCloseConfirm } from "shared/hooks"
import { AlertError } from "shared/ui"

interface ErrorData {
  data?: string
  group_name?: string
}

interface CreateParameterModalProps {
  projectId: Id
}

export const CreateEditParameterModal = ({ projectId }: CreateParameterModalProps) => {
  const { t } = useTranslation()
  const { showModal } = useShowModalCloseConfirm()
  const dispatch = useDispatch()
  const isShow = useAppSelector(selectModalIsShow)
  const isEditMode = useAppSelector(selectModalIsEditMode)
  const parameter = useSelector(selectParameter)
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty },
  } = useForm<IParameterUpdate>()
  const [createParameter, { isLoading }] = useCreateParameterMutation()
  const [updateParameter] = useUpdateParameterMutation()
  const { onHandleError } = useErrors<ErrorData>(setErrors)

  useEffect(() => {
    if (isEditMode && parameter) {
      setValue("data", parameter.data)
      setValue("group_name", parameter.group_name)
    }
  }, [isEditMode, parameter])

  const onSubmit: SubmitHandler<IParameterUpdate> = async (data) => {
    setErrors(null)
    try {
      isEditMode && parameter
        ? await updateParameter({
            id: parameter.id,
            body: {
              ...data,
              project: parameter.project,
            },
          }).unwrap()
        : await createParameter({
            ...data,
            project: projectId,
          }).unwrap()
      onCloseModal()
      notification.success({
        message: t("Success"),
        closable: true,
        description: isEditMode
          ? t("Parameter updated successfully")
          : t("Parameter created successfully"),
      })
    } catch (err: unknown) {
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
      showModal(onCloseModal)
      return
    }

    onCloseModal()
  }

  const title = isEditMode
    ? `${t("Edit")} ${t("Parameter")} ${parameter?.data}`
    : `${t("Create")} ${t("Parameter")}`

  return (
    <Modal
      className="create-edit-parameter-modal"
      title={title}
      open={isShow}
      onCancel={handleCancel}
      width="600px"
      centered
      footer={[
        <Button id="close-update-create-parameter" key="back" onClick={handleCancel}>
          {t("Close")}
        </Button>,
        <Button
          id="update-create-parameter"
          loading={isLoading}
          key="submit"
          onClick={handleSubmit(onSubmit)}
          type="primary"
          disabled={!isDirty}
        >
          {isEditMode ? t("Update") : t("Create")}
        </Button>,
      ]}
    >
      <>
        {errors ? (
          <AlertError error={errors as ErrorObj} skipFields={["data", "group_name"]} />
        ) : null}

        <Form id="create-edit-parameter-form" layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label="Name"
            validateStatus={errors?.data ? "error" : ""}
            help={errors?.data ? errors.data : ""}
          >
            <Controller
              name="data"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item
            label="Group"
            validateStatus={errors?.group_name ? "error" : ""}
            help={errors?.group_name ? errors.group_name : ""}
          >
            <Controller
              name="group_name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
        </Form>
      </>
    </Modal>
  )
}

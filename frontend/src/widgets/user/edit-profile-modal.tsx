import { Form, Input, Modal } from "antd"
import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useDispatch, useSelector } from "react-redux"

import { useAppSelector } from "app/hooks"

import { selectUser } from "entities/auth/model"

import { useUpdateMeMutation } from "entities/user/api"
import { hideEditProfileModal, selectProfileModalIsShow } from "entities/user/model"

import { ErrorObj, useErrors } from "shared/hooks"
import { antdModalCloseConfirm, antdNotification } from "shared/libs/antd-modals"
import { AlertError, Button } from "shared/ui"

interface Inputs {
  first_name: string
  last_name: string
}

interface ErrorData {
  first_name?: string
  last_name?: string
}

const TEST_ID = "edit-profile"

export const EditProfileModal = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const isShow = useAppSelector(selectProfileModalIsShow)
  const user = useSelector(selectUser)
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty },
  } = useForm<Inputs>()
  const [updateProfile, { isLoading }] = useUpdateMeMutation()
  const { onHandleError } = useErrors<ErrorData>(setErrors)

  useEffect(() => {
    if (isShow && user) {
      setValue("first_name", user.first_name)
      setValue("last_name", user.last_name)
    }
  }, [isShow, user])

  const onCloseModal = () => {
    dispatch(hideEditProfileModal())
    setErrors(null)
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

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setErrors(null)
    try {
      await updateProfile(data).unwrap()
      onCloseModal()
      antdNotification.success("edit-profile", {
        description: t("Profile updated successfully"),
      })
    } catch (err: unknown) {
      onHandleError(err)
    }
  }

  return (
    <Modal
      bodyProps={{ "data-testid": `${TEST_ID}-modal-body` }}
      wrapProps={{ "data-testid": `${TEST_ID}-modal-wrapper` }}
      title={<span data-testid={`${TEST_ID}-modal-title`}>{t("Edit Profile")}</span>}
      open={isShow}
      onCancel={handleCancel}
      width="600px"
      centered
      footer={[
        <Button id={`close-${TEST_ID}`} key="back" onClick={handleCancel} color="secondary-linear">
          {t("Close")}
        </Button>,
        <Button
          id={`update-${TEST_ID}`}
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
          <AlertError error={errors as ErrorObj} skipFields={["first_name", "last_name"]} />
        ) : null}

        <Form id="edit-profile-form" layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label={t("First Name")}
            validateStatus={errors?.first_name ? "error" : ""}
            help={errors?.first_name ? errors.first_name : ""}
          >
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item
            label={t("Last Name")}
            validateStatus={errors?.last_name ? "error" : ""}
            help={errors?.last_name ? errors.last_name : ""}
          >
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
        </Form>
      </>
    </Modal>
  )
}

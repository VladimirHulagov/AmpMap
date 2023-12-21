import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useCreateUserMutation, useUpdateUserMutation } from "entities/user/api"
import {
  hideModal,
  selectModalIsEditMode,
  selectModalIsShow,
  selectUser as selectUserModal,
} from "entities/user/model"

import { useErrors } from "shared/hooks"
import { showModalCloseConfirm } from "shared/libs"

interface Inputs {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  confirm: string
  is_active: boolean
  is_staff: boolean
}

interface ErrorData {
  username?: string
  email?: string
  password?: string
  confirm?: string
  first_name?: string
  last_name?: string
  is_active?: string
  is_staff?: string
}

export const useUserModal = () => {
  const dispatch = useAppDispatch()
  const isShow = useAppSelector(selectModalIsShow)
  const isEditMode = useAppSelector(selectModalIsEditMode)
  const modalUser = useAppSelector(selectUserModal)
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    getValues,
    formState: { isDirty },
  } = useForm<Inputs>({
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      confirm: "",
      username: "",
      is_active: true,
      is_staff: true,
    },
  })
  const [createUser, { isLoading }] = useCreateUserMutation()
  const [updateUser] = useUpdateUserMutation()
  const { onHandleError } = useErrors(setErrors)

  const password = watch("password")
  const passwordConfirm = watch("confirm")
  const isActive = watch("is_active")
  const isStaff = watch("is_staff")

  useEffect(() => {
    const [password, passwordConfirm] = getValues(["password", "confirm"])
    if (password !== passwordConfirm && password && passwordConfirm) {
      setErrors({ confirm: "The passwords that you entered do not match!" })
    } else {
      setErrors(null)
    }
  }, [password, passwordConfirm])

  useEffect(() => {
    if (isEditMode && modalUser) {
      setValue("username", modalUser.username)
      setValue("email", modalUser.email)
      setValue("first_name", modalUser.first_name)
      setValue("last_name", modalUser.last_name)
      setValue("is_active", modalUser.is_active)
      setValue("is_staff", modalUser.is_staff)
    } else {
      setValue("is_active", true)
      setValue("is_staff", true)
    }
  }, [isEditMode, modalUser])

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const [password, confirm, username, email] = getValues([
      "password",
      "confirm",
      "username",
      "email",
    ])

    const isShortChange = isEditMode && !password && !confirm
    const fields = isShortChange ? { username, email } : { password, confirm, username, email }

    const errors: ErrorData = {} as ErrorData
    Object.keys(fields).forEach((key) => {
      const fieldName = key as keyof typeof fields
      if (!fields[fieldName]) {
        errors[fieldName] = "This field can not be empty!"
      }
    })

    if (password !== confirm && password && confirm) {
      errors.confirm = "The passwords that you entered do not match!"
    }

    if (Object.keys(errors).length) {
      setErrors(errors)
      return
    }
    setErrors(null)

    if (isShortChange) {
      //@ts-ignore
      delete data.password
      //@ts-ignore
      delete data.confirm
    }

    try {
      isEditMode && modalUser
        ? await updateUser({ id: modalUser.id, body: data }).unwrap()
        : await createUser({
            ...data,
          }).unwrap()
      onCloseModal()
      notification.success({
        message: "Success",
        description: `User ${isEditMode ? "updated" : "created"} successfully`,
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

  const title = isEditMode ? `Edit User '${modalUser?.username}'` : "Create User"

  return {
    title,
    isShow,
    isEditMode,
    isLoading,
    isActive,
    isStaff,
    isDirty,
    errors,
    control,
    handleCancel,
    handleSubmitForm: handleSubmit(onSubmit),
  }
}

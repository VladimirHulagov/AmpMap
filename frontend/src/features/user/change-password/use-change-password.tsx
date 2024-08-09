import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useSelector } from "react-redux"

import { useUpdatePasswordMutation } from "entities/user/api"
import { selectUser } from "entities/user/model"

import { useErrors } from "shared/hooks"

interface Inputs {
  password: string
  confirm?: string
}

interface ErrorData {
  password?: string
  confirm?: string
}

const MIN_PASSWORD_LENGTH = 8
const validatePassword = (value: string) => {
  if (!/[A-Z]/.test(value)) {
    return { password: "Password must have at least one uppercase character." }
  }
  if (!/[a-z]/.test(value)) {
    return { password: "Password must have at least one lowercase character." }
  }
  if (!/\d/.test(value)) {
    return { password: "Password must have at least one digit." }
  }
  if (!/[!@#$%^&*]/.test(value)) {
    return { password: "Password must have at least one special character." }
  }
  if (value.length < MIN_PASSWORD_LENGTH) {
    return { password: `Password must have at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  return null
}

export const useChangePassword = () => {
  const user = useSelector(selectUser)
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty },
    getValues,
    watch,
  } = useForm<Inputs>()
  const [updatePassword, { isLoading }] = useUpdatePasswordMutation()
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const [isShow, setIsShow] = useState(false)

  const password = watch("password")
  const passwordConfirm = watch("confirm")

  useEffect(() => {
    const [password, passwordConfirm] = getValues(["password", "confirm"])
    if (!password && !passwordConfirm) {
      setErrors(null)
      return
    }
    const passwordValidation = validatePassword(password)
    if (passwordValidation) {
      setErrors(passwordValidation)
      return
    }

    if (password !== passwordConfirm) {
      setErrors({ confirm: "The passwords that you entered do not match!" })
    } else {
      setErrors(validatePassword(password))
    }
  }, [password, passwordConfirm])

  const handleCancel = () => {
    setIsShow(false)
    setErrors(null)
    reset()
  }

  const handleShow = () => {
    setIsShow(true)
  }

  const handleSave: SubmitHandler<Inputs> = async (data) => {
    if (errors) {
      return
    }

    try {
      const { password } = data

      await updatePassword({ password }).unwrap()
      notification.success({
        message: "Success",
        description: "Password updated successfully",
      })
      handleCancel()
    } catch (err: unknown) {
      onHandleError(err)
    }
  }

  useEffect(() => {
    if (isShow && user) {
      setValue("password", "")
      setValue("confirm", "")
    }
  }, [user, isShow])

  const saveDisabled = !isDirty || isLoading || !!errors

  return {
    handleSave,
    handleCancel,
    handleShow,
    saveDisabled,
    errors,
    control,
    handleSubmit,
    isShow,
    password,
  }
}

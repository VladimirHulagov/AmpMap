import { notification } from "antd"
import { useEffect, useMemo, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useGetUsersQuery } from "entities/user/api"

import { useErrors } from "shared/hooks"

import { useUpdateTestMutation } from "../api"
import { selectTest, setTest } from "./slice"

interface UpdateData {
  assignUserId: string
}

export const useAssignTo = () => {
  const activeTest = useAppSelector(selectTest)
  const dispatch = useAppDispatch()
  const [updateTest, { isLoading: isLoadingUpdateTest }] = useUpdateTestMutation()
  const { data: users, isLoading: isLoadingUsers } = useGetUsersQuery()

  const [isOpenModal, setIsOpenModal] = useState(false)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty },
  } = useForm<UpdateData>()
  const [errors, setErrors] = useState<Partial<UpdateData> | null>(null)
  const { onHandleError } = useErrors<Partial<UpdateData>>(setErrors)

  const handleClose = () => {
    setIsOpenModal(false)
    reset()
  }

  const handleOpenAssignModal = () => {
    setIsOpenModal(true)
  }

  const onSubmit: SubmitHandler<UpdateData> = async (data) => {
    if (!activeTest) return
    setErrors(null)

    try {
      const result = await updateTest({
        id: activeTest.id,
        body: {
          assignee: data.assignUserId,
        },
      }).unwrap()
      dispatch(setTest(result))

      notification.success({
        message: "Success",
        description: "User assigned successfully",
      })
    } catch (err) {
      onHandleError(err)
    } finally {
      reset()
      handleClose()
    }
  }

  const handleAssignUserChange = (value: string) => {
    setValue("assignUserId", value || "", { shouldDirty: true })
  }

  const handleAssignUserClear = () => {
    handleAssignUserChange("")
  }

  useEffect(() => {
    if (!activeTest || !users || !users.length || !isOpenModal) return
    const findUser = users.find((i) => Number(i.id) === Number(activeTest.assignee))
    setValue("assignUserId", findUser ? String(findUser.id) : "", { shouldDirty: false })
  }, [activeTest, users, isOpenModal])

  const selectUsers = useMemo(() => {
    if (!users?.length) return []
    return users.map((i) => ({ value: String(i.id), label: i.username }))
  }, [users])

  return {
    activeTest,
    isOpenModal,
    errors,
    control,
    isDirty,
    selectUsers,
    isLoadingUsers,
    isLoadingUpdateTest,
    handleClose,
    handleSubmitForm: handleSubmit(onSubmit),
    handleOpenAssignModal,
    handleAssignUserChange,
    handleAssignUserClear,
  }
}

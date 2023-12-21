import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useUpdateTestMutation } from "entities/test/api"
import { selectTest, setTest } from "entities/test/model/slice"

import { useGetMeQuery } from "entities/user/api"

import { useErrors } from "shared/hooks"

interface UpdateData {
  assignUserId: string
}

export const useAssignTo = () => {
  const activeTest = useAppSelector(selectTest)
  const dispatch = useAppDispatch()
  const [selectedUser, setSelectedUser] = useState<SelectData | null>(null)
  const [updateTest, { isLoading: isLoadingUpdateTest }] = useUpdateTestMutation()
  const { data: me } = useGetMeQuery()

  const [isOpenModal, setIsOpenModal] = useState(false)
  const {
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty },
  } = useForm<UpdateData>()
  const [errors, setErrors] = useState<Partial<UpdateData> | null>(null)
  const { onHandleError } = useErrors<Partial<UpdateData>>(setErrors)

  const assignRequest = async (test: Test, assignUserId: string) => {
    try {
      const result = await updateTest({
        id: test.id,
        body: {
          assignee: assignUserId,
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

  const handleClose = () => {
    setIsOpenModal(false)
    reset()
  }

  const handleOpenAssignModal = () => {
    setIsOpenModal(true)
  }

  const handleAssignToMe = async () => {
    if (!activeTest || !me) return
    await assignRequest(activeTest, String(me.id))
  }

  const onSubmit: SubmitHandler<UpdateData> = async (data) => {
    if (!activeTest) return
    setErrors(null)

    await assignRequest(activeTest, data.assignUserId)
  }

  const handleAssignUserChange = (data?: SelectData) => {
    if (!data) return
    setSelectedUser(data)
    setValue("assignUserId", String(data.value) || "", { shouldDirty: true })
  }

  const handleAssignUserClear = () => {
    setSelectedUser(null)
    setValue("assignUserId", "", { shouldDirty: true })
  }

  useEffect(() => {
    if (!activeTest?.assignee) return
    setSelectedUser({
      label: String(activeTest.assignee_username),
      value: Number(activeTest.assignee),
    })
  }, [activeTest])

  return {
    activeTest,
    isOpenModal,
    errors,
    isDirty,
    isLoadingUpdateTest,
    me,
    selectedUser: selectedUser ?? undefined,
    handleClose,
    handleSubmitForm: handleSubmit(onSubmit),
    handleOpenAssignModal,
    handleAssignUserChange,
    handleAssignUserClear,
    handleAssignToMe,
  }
}

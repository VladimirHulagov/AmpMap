import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { notification } from "antd"
import { useEffect, useMemo, useState } from "react"

import { useGetProjectsQuery } from "entities/project/api"

import { useCopySuiteMutation } from "entities/suite/api"

import { AlertSuccessChange } from "shared/ui/alert-success-change"

export const useSuiteCopyModal = (suite: ISuite) => {
  const [isShow, setIsShow] = useState(false)
  const [copySuite, { isLoading }] = useCopySuiteMutation()
  const { data, isLoading: isLoadingProjects } = useGetProjectsQuery(false)
  const [newName, setNewName] = useState("")
  const [selectedProject, setSelectedProject] = useState("")

  const handleCancel = () => {
    setIsShow(false)
    setSelectedProject("")
  }

  const handleShow = () => {
    setIsShow(true)
  }

  const handleSave = async () => {
    try {
      await copySuite({
        suites: [{ id: String(suite.id), new_name: newName }],
        dst_project_id: selectedProject,
      })
      notification.success({
        message: "Success",
        description: <AlertSuccessChange id={String(suite.id)} action="copied" title="Suite" />,
      })
      handleCancel()
    } catch (err) {
      const error = err as FetchBaseQueryError

      console.error(error)
      notification.error({
        message: "Error!",
        description: "Internal server error. Showing in console log.",
      })
    }
  }

  const handleChange = (value: { label: string; value: string }) => {
    setSelectedProject(value.value)
  }

  const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value)
  }

  useEffect(() => {
    if (!isShow) return
    setNewName(`${suite.name}(Copy)`)
  }, [suite, isShow])

  const projects = useMemo(() => {
    if (!data) return []

    return data.map((i) => ({
      label: i.name,
      value: i.id,
    }))
  }, [data])

  return {
    handleCancel,
    handleShow,
    handleSave,
    handleChange,
    handleChangeName,
    isShow,
    isLoading,
    isLoadingProjects,
    projects,
    newName,
  }
}

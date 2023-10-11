import { PlusOutlined } from "@ant-design/icons"
import { Button, Space } from "antd"
import React, { useContext, useEffect } from "react"
import { useDispatch } from "react-redux"
import { useOutletContext } from "react-router-dom"

import { showCreateParameterModal } from "entities/parameter/model"
import { ParametersTable } from "entities/parameter/ui/parameters-table"

import {
  ProjectDetailsActiveTabContext,
  ProjectDetailsActiveTabContextType,
} from "pages/administration/projects/project-details/project-details-main"

import { CreateEditParameterModal } from "./create-edit-parameter-modal"

export const ProjectDetailsParametersPage = () => {
  const dispatch = useDispatch()
  const { setProjectDetailsActiveTab } = useContext(
    ProjectDetailsActiveTabContext
  ) as ProjectDetailsActiveTabContextType
  const projectId: Id = useOutletContext()

  useEffect(() => {
    setProjectDetailsActiveTab("parameters")
  }, [])

  const handleCreateClick = () => {
    dispatch(showCreateParameterModal())
  }

  return (
    <>
      <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
        <Space style={{ display: "flex", justifyContent: "right" }}>
          <Button
            id="create-parameter"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateClick}
            style={{ marginBottom: 16, float: "right" }}
          >
            Create Parameter
          </Button>
        </Space>
        <CreateEditParameterModal projectId={projectId} />
        <ParametersTable />
      </div>
    </>
  )
}

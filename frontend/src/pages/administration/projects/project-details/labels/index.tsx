import { PlusOutlined } from "@ant-design/icons"
import { Button, Space } from "antd"
import { useContext, useEffect } from "react"
import { useDispatch } from "react-redux"

import { showLabelModal } from "entities/label/model"
import { LabelsTable } from "entities/label/ui"

import { ProjectDetailsActiveTabContext } from "pages/administration/projects/project-details/project-details-main"

export const ProjectDetailsLabelsPage = () => {
  const dispatch = useDispatch()
  const { setProjectDetailsActiveTab } = useContext(ProjectDetailsActiveTabContext)!

  useEffect(() => {
    setProjectDetailsActiveTab("labels")
  }, [])

  const handleCreateClick = () => {
    dispatch(showLabelModal({ mode: "create" }))
  }

  return (
    <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
      <Space style={{ display: "flex", justifyContent: "right" }}>
        <Button
          id="create-label"
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateClick}
          style={{ marginBottom: 16, float: "right" }}
        >
          Create Label
        </Button>
      </Space>
      <LabelsTable />
    </div>
  )
}

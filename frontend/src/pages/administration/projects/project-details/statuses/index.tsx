import { CheckOutlined } from "@ant-design/icons"
import { Button, Space, notification } from "antd"
import { CreateStatusButton } from "features/status"
import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { StatusesTable } from "widgets"

import { useUpdateProjectJsonMutation } from "entities/project/api"

import { initInternalError } from "shared/libs"
import { AlertSuccessChange } from "shared/ui"

import { ProjectDetailsActiveTabContext } from "../project-details-main"

export const ProjectDetailsStatusesPage = () => {
  const { projectId } = useParams<ParamProjectId>()
  const { setProjectDetailsActiveTab } = useContext(ProjectDetailsActiveTabContext)!
  const [orderedStatuses, setOrderedStatuses] = useState<Status[]>([])
  const [updateProject] = useUpdateProjectJsonMutation()

  useEffect(() => {
    setProjectDetailsActiveTab("statuses")
  }, [])

  const handleChangeOrder = (statuses: Status[]) => {
    setOrderedStatuses(statuses)
  }

  const handleSaveOrder = async () => {
    if (!projectId) {
      return
    }

    try {
      const status_order = orderedStatuses.reduce(
        (acc, status, index) => {
          acc[status.id] = index
          return acc
        },
        {} as Record<string, number>
      )

      await updateProject({
        id: parseInt(projectId),
        body: { settings: { status_order } },
      }).unwrap()

      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            action="updated"
            title="Project status settings"
            link={`/administration/projects/${projectId}/statuses`}
            id={projectId}
          />
        ),
      })

      setOrderedStatuses([])
    } catch (err) {
      initInternalError(err)
    }
  }

  return (
    <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
      <Space style={{ display: "flex", justifyContent: "right" }}>
        <CreateStatusButton />
        <Button
          id="save-order"
          type="primary"
          icon={<CheckOutlined />}
          onClick={handleSaveOrder}
          style={{ marginBottom: 16, float: "right" }}
          disabled={!orderedStatuses.length}
        >
          Save order
        </Button>
      </Space>
      <StatusesTable onChangeOrder={handleChangeOrder} />
    </div>
  )
}

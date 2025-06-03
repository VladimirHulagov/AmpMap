import { CheckOutlined } from "@ant-design/icons"
import { Space, notification } from "antd"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StatusesTable } from "widgets"

import { useUpdateProjectJsonMutation } from "entities/project/api"

import { CreateStatusButton } from "features/status"

import { useProjectContext } from "pages/project"

import { initInternalError } from "shared/libs"
import { AlertSuccessChange, Button } from "shared/ui"

export const ProjectStatusesTabPage = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const [orderedStatuses, setOrderedStatuses] = useState<Status[]>([])
  const [updateProject] = useUpdateProjectJsonMutation()

  const handleChangeOrder = (statuses: Status[]) => {
    setOrderedStatuses(statuses)
  }

  const handleSaveOrder = async () => {
    try {
      const status_order = orderedStatuses.reduce(
        (acc, status, index) => {
          acc[status.id] = index
          return acc
        },
        {} as Record<string, number>
      )

      await updateProject({
        id: project.id,
        body: { settings: { status_order } },
      }).unwrap()

      notification.success({
        message: t("Success"),
        description: (
          <AlertSuccessChange
            action="updated"
            title={t("Project status settings")}
            link={`/projects/${project.id}/statuses`}
            id={String(project.id)}
          />
        ),
      })

      setOrderedStatuses([])
    } catch (err) {
      initInternalError(err)
    }
  }

  return (
    <>
      <Space style={{ display: "flex", justifyContent: "right" }}>
        <CreateStatusButton />
        <Button
          id="save-order"
          color="accent"
          icon={<CheckOutlined />}
          onClick={handleSaveOrder}
          style={{ marginBottom: 16, float: "right" }}
          disabled={!orderedStatuses.length}
        >
          {t("Save order")}
        </Button>
      </Space>
      <StatusesTable onChangeOrder={handleChangeOrder} />
    </>
  )
}

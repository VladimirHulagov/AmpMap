import { Divider, Space, Typography } from "antd"
import { useContext, useEffect } from "react"
import { useParams } from "react-router-dom"

import { useGetProjectQuery } from "entities/project/api"

import { ContainerLoader, Field, TagBoolean } from "shared/ui"

import { ProjectDetailsActiveTabContext } from "../project-details-main"
import { EditTestResultsSettings } from "./edit-test-results-settings"

export const ProjectDetailsSettingsPage = () => {
  const { setProjectDetailsActiveTab } = useContext(ProjectDetailsActiveTabContext)!
  useEffect(() => {
    setProjectDetailsActiveTab("settings")
  })
  const { projectId } = useParams<ParamProjectId>()
  const { data, isLoading } = useGetProjectQuery(Number(projectId), { skip: !projectId })

  if (isLoading || !data) {
    return <ContainerLoader />
  }

  const editTime = data?.settings.result_edit_limit
    ? `${data.settings.result_edit_limit}`
    : `Unlimited`
  return (
    <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
      {!isLoading && data?.is_manageable && (
        <Space style={{ marginBottom: "16px", float: "right" }}>
          <EditTestResultsSettings project={data} />
        </Space>
      )}
      <Divider orientation="left" orientationMargin={0}>
        <div style={{ display: "flex", alignItems: "center", margin: "12px 0" }}>
          <Typography.Title style={{ margin: "0 8px 0 0" }} level={4}>
            Test Results
          </Typography.Title>
        </div>
      </Divider>

      <div style={{ padding: 8 }}>
        <Field
          title="Is Editable"
          value={
            <TagBoolean value={data.settings.is_result_editable} trueText="Yes" falseText="No" />
          }
        />
        {data.settings.is_result_editable && <Field title="Edit time" value={editTime} />}
      </div>
    </div>
  )
}

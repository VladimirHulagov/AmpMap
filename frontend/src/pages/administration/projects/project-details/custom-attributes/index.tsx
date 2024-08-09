import { Space } from "antd"
import { ChangeCustomAttribute } from "features/custom-attribute"
import { useContext, useEffect } from "react"

import { ProjectDetailsActiveTabContext } from "pages/administration/projects/project-details/project-details-main"

import { CustomAttributesTable } from "widgets/custom-attribute"

export const ProjectDetailsCustomAttributesPage = () => {
  const { setProjectDetailsActiveTab } = useContext(ProjectDetailsActiveTabContext)!

  useEffect(() => {
    setProjectDetailsActiveTab("attributes")
  }, [])

  return (
    <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
      <Space style={{ display: "flex", justifyContent: "right" }}>
        <ChangeCustomAttribute formType="create" />
      </Space>
      <CustomAttributesTable />
    </div>
  )
}

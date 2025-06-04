import { Space } from "antd"

import { ChangeCustomAttribute } from "features/custom-attribute"

import { CustomAttributesTable } from "widgets/custom-attribute"

export const ProjectCustomAttributesTabPage = () => {
  return (
    <>
      <Space style={{ display: "flex", justifyContent: "right" }}>
        <ChangeCustomAttribute formType="create" />
      </Space>
      <CustomAttributesTable />
    </>
  )
}

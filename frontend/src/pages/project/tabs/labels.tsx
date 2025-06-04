import { Space } from "antd"

import { CreateLabelButton } from "features/label"

import { LabelsTable } from "widgets/label"

export const ProjectLabelsTabPage = () => {
  return (
    <>
      <Space style={{ display: "flex", justifyContent: "right" }}>
        <CreateLabelButton />
      </Space>
      <LabelsTable />
    </>
  )
}

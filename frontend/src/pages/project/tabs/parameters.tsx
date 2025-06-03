import { PlusOutlined } from "@ant-design/icons"
import { Space } from "antd"
import { useTranslation } from "react-i18next"
import { useDispatch } from "react-redux"

import { showCreateParameterModal } from "entities/parameter/model"
import { ParametersTable } from "entities/parameter/ui/parameters-table"

import { CreateEditParameterModal } from "features/project"

import { useProjectContext } from "pages/project/project-provider"

import { Button } from "shared/ui"

export const ProjectParametersTabPage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const project = useProjectContext()

  const handleCreateClick = () => {
    dispatch(showCreateParameterModal())
  }

  return (
    <>
      <Space style={{ display: "flex", justifyContent: "right" }}>
        <Button
          id="create-parameter"
          color="accent"
          icon={<PlusOutlined />}
          onClick={handleCreateClick}
          style={{ marginBottom: 16, float: "right" }}
        >
          {t("Create")} {t("Parameter")}
        </Button>
      </Space>
      <CreateEditParameterModal projectId={project.id} />
      <ParametersTable />
    </>
  )
}

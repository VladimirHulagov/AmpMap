import { Divider, Space, Typography } from "antd"
import { useMeContext } from "processes"
import { useTranslation } from "react-i18next"

import { EditProjectTestResultsSettings } from "features/project"

import { useProjectContext } from "pages/project"

import { Field, TagBoolean } from "shared/ui"

export const ProjectSettingsTabPage = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { me } = useMeContext()
  const editable = !project.is_archive || me?.is_superuser

  const editTime = project.settings.result_edit_limit
    ? `${project.settings.result_edit_limit}`
    : `Unlimited`

  return (
    <>
      {project.is_manageable && editable && (
        <Space style={{ display: "flex", justifyContent: "right" }}>
          <EditProjectTestResultsSettings project={project} />
        </Space>
      )}
      <Divider orientation="left" orientationMargin={0}>
        <div style={{ display: "flex", alignItems: "center", margin: "12px 0" }}>
          <Typography.Title style={{ margin: "0 8px 0 0" }} level={4}>
            {t("Test Results")}
          </Typography.Title>
        </div>
      </Divider>

      <div style={{ padding: 8 }}>
        <Field
          title={t("Is Editable")}
          value={
            <TagBoolean
              value={!!project.settings.is_result_editable}
              trueText={t("Yes")}
              falseText={t("No")}
            />
          }
        />
        {project.settings.is_result_editable && <Field title={t("Edit time")} value={editTime} />}
      </div>
    </>
  )
}

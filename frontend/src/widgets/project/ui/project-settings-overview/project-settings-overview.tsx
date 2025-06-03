import { Flex, Typography } from "antd"
import { useTranslation } from "react-i18next"

import { useProjectContext } from "pages/project"

import styles from "./styles.module.css"

export const ProjectSettingsOverview = () => {
  const { t } = useTranslation()
  const project = useProjectContext()

  const editTime = project.settings.result_edit_limit
    ? `${project.settings.result_edit_limit}`
    : `Unlimited`

  return (
    <Flex vertical>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        {t("Settings")}
      </Typography.Title>
      <Flex vertical gap={16}>
        <div className={styles.row}>
          <div className={styles.label}>{t("Status")}</div>
          <span className={styles.value} data-testid="project-is-archive">
            <div
              className={styles.statusIcon}
              style={{
                backgroundColor: project.is_private
                  ? "var(--y-color-error)"
                  : "var(--y-color-accent)",
              }}
            />
            {project.is_archive ? t("Archived") : t("Active")}
          </span>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>{t("Type")}</div>
          <span className={styles.value} data-testid="project-is-private">
            {project.is_private ? t("Private") : t("Public")}
          </span>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>{t("Editable Test Results")}</div>
          <span className={styles.value} data-testid="project-is-editable-test-result">
            {project.settings.is_result_editable ? t("Yes") : t("No")}
          </span>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>{t("Result Edit Time")}</div>
          <span className={styles.value} data-testid="project-result-edit-time">
            {editTime}
          </span>
        </div>
      </Flex>
    </Flex>
  )
}

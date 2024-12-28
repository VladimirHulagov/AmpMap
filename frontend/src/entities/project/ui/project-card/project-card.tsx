import { Flex } from "antd"
import cn from "classnames"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { RequestProjectAccess } from "features/project"

import { icons } from "shared/assets/inner-icons"
import { ArchivedTag } from "shared/ui"

import { ProjectIcon } from ".."
import styles from "./styles.module.css"

const { DashboardIcon, TestPlansIcon, TestSuitesIcon } = icons

interface Props {
  project: Project
  folowProject: React.ReactNode
}

const ICON_STYLE = { width: 16, marginRight: 4 }

export const ProjectCard = ({ project, folowProject }: Props) => {
  const { t } = useTranslation()

  return (
    <div className={styles.cardWrapper}>
      <div className={cn({ [styles.cardBlured]: !project.is_visible })}>
        <div className={cn(styles.cardContainer)}>
          <div className={styles.nameBlock}>
            <ProjectIcon icon={project.icon} name={project.name} size={32} />
            <Flex gap={8} align="center">
              {project.is_archive && <ArchivedTag />}
              <Link className={styles.name} to={`/projects/${project.id}/overview`}>
                {project.name}
              </Link>
            </Flex>
          </div>
          <div className={styles.action}>{folowProject}</div>
          <ul className={styles.dataBlock}>
            <li>
              <span className={styles.dataCount}>{project.suites_count}</span>
              <span className={styles.dataTitle}>{t("Test Suites")}</span>
            </li>
            <li>
              <span className={styles.dataCount}>{project.plans_count}</span>
              <span className={styles.dataTitle}>{t("Test Plans")}</span>
            </li>
            <li>
              <span className={styles.dataCount}>{project.cases_count}</span>
              <span className={styles.dataTitle}>{t("Test Cases")}</span>
            </li>
            <li>
              <span className={styles.dataCount}>{project.tests_count}</span>
              <span className={styles.dataTitle}>{t("Tests")}</span>
            </li>
          </ul>
        </div>
        <ul className={styles.btnsBlock}>
          <Link id={`${project.name}-link-overview`} to={`/projects/${project.id}/overview`}>
            <li className={styles.btnBlock}>
              <DashboardIcon style={ICON_STYLE} />
              <span className={styles.btnBlockTitle}>{t("Overview")}</span>
            </li>
          </Link>
          <Link id={`${project.name}-link-suites`} to={`/projects/${project.id}/suites`}>
            <li className={styles.btnBlock}>
              <TestSuitesIcon style={ICON_STYLE} />
              <span className={styles.btnBlockTitle}>{t("Test Suites")}</span>
            </li>
          </Link>
          <Link id={`${project.name}-link-plans`} to={`/projects/${project.id}/plans`}>
            <li className={styles.btnBlock}>
              <TestPlansIcon style={ICON_STYLE} />
              <span className={styles.btnBlockTitle}>{t("Test Plans")}</span>
            </li>
          </Link>
        </ul>
      </div>
      {!project.is_visible && <RequestProjectAccess project={project} />}
    </div>
  )
}

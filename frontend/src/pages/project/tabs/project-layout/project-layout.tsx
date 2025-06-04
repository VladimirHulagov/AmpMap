import { Button, Flex, Popover, Tabs, Tooltip } from "antd"
import { TabsProps } from "antd/lib"
import { useMeContext } from "processes"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useNavigate } from "react-router-dom"

import { ProjectTab } from "entities/project/model/enum"
import { ProjectIcon, ProjectStats } from "entities/project/ui"

import { ArchiveProject, DeleteProject, EditProject, FolowProject } from "features/project"

import ArchiveIcon from "shared/assets/yi-icons/archive.svg?react"
import ContextMenuIcon from "shared/assets/yi-icons/context-menu.svg?react"
import DeleteIcon from "shared/assets/yi-icons/delete.svg?react"
import { Collapse, Markdown } from "shared/ui"

import { useProjectContext } from "../../project-provider"
import styles from "./styles.module.css"

export const ProjectLayout = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { me } = useMeContext()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ProjectTab>(ProjectTab.OVERVIEW)

  const tabItems: TabsProps["items"] = [
    {
      key: ProjectTab.OVERVIEW,
      label: t("Overview"),
    },
    {
      key: ProjectTab.PARAMETERS,
      label: t("Parameters"),
    },
    {
      key: ProjectTab.LABELS,
      label: t("Labels"),
    },
    {
      key: ProjectTab.STATUSES,
      label: t("Statuses"),
    },
    {
      key: ProjectTab.CUSTOM_ATTRIBUTES,
      label: t("Custom Attributes"),
    },
    {
      key: ProjectTab.SETTINGS,
      label: t("Settings"),
    },
    {
      key: ProjectTab.ACCESS_MANAGEMENT,
      label: t("Access Management"),
    },
  ]

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab as ProjectTab)
    navigate(`/projects/${project.id}/${newTab}`)
  }

  useEffect(() => {
    const pathSegments = location.pathname.split("/")
    const lastSegment = pathSegments[pathSegments.length - 1] as ProjectTab
    const foundInTabItems = tabItems.find((i) => i.key === lastSegment)
    if (!foundInTabItems) return
    setActiveTab(foundInTabItems.key as ProjectTab)
  }, [location.pathname])

  const editable = !project.is_archive || me?.is_superuser

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerContainer}>
        <div className={styles.topHeader}>
          <div className={styles.projectHeder}>
            <div className={styles.projectTitle}>
              <ProjectIcon
                icon={project.icon}
                name={project.name}
                size={32}
                data-testid="project-icon"
              />
              <span data-testid="project-name">{project.name}</span>
            </div>
            {project.is_archive && (
              <Tooltip title={t("Archived")}>
                <ArchiveIcon
                  width={32}
                  height={32}
                  color="var(--y-color-text-tertiary)"
                  data-testid="project-archive-icon"
                />
              </Tooltip>
            )}
          </div>
          <div className={styles.actions}>
            {project.is_manageable && editable && <EditProject project={project} />}
            <FolowProject project={project} />
            <Popover
              overlayInnerStyle={{
                paddingBottom: 8,
                paddingTop: 8,
                paddingInline: 0,
                minWidth: 172,
              }}
              content={
                <Flex gap={4} vertical>
                  {!project.is_archive && (
                    <ArchiveProject
                      project={project}
                      as={
                        <Button
                          type="text"
                          icon={<ArchiveIcon width={24} height={24} />}
                          className={styles.actionContextBtn}
                        >
                          {t("Archive")}
                        </Button>
                      }
                    />
                  )}
                  <DeleteProject
                    project={project}
                    as={
                      <Button
                        type="text"
                        icon={<DeleteIcon width={24} height={24} />}
                        className={styles.actionContextBtn}
                      >
                        {t("Delete")}
                      </Button>
                    }
                  />
                </Flex>
              }
              trigger="click"
              arrow={false}
              placement="bottomLeft"
            >
              <Button
                type="text"
                icon={
                  <ContextMenuIcon width={24} height={24} color="var(--y-color-text-tertiary)" />
                }
                data-testid="project-context-menu"
              />
            </Popover>
          </div>
        </div>
        {!!project.description.length && (
          <Collapse
            title={t("Description")}
            data-testid="project-description-collapse"
            style={{
              marginBottom: 32,
              paddingLeft: 24,
              paddingRight: 24,
              paddingBottom: 0,
              paddingTop: 0,
            }}
            defaultCollapse
          >
            <div data-testid="project-description">
              <Markdown content={project.description} />
            </div>
          </Collapse>
        )}
      </div>
      <ProjectStats
        projectId={project.id}
        testSuites={project.suites_count}
        testCases={project.cases_count}
        testPlans={project.plans_count}
        tests={project.tests_count}
      />
      <Tabs
        defaultActiveKey={ProjectTab.OVERVIEW}
        activeKey={activeTab}
        items={tabItems}
        onChange={handleTabChange}
        style={{ paddingLeft: 24, paddingRight: 24, marginTop: 16 }}
        data-testid="project-tabs"
      />
      <div className={styles.tabBody}>
        <Outlet />
      </div>
    </div>
  )
}

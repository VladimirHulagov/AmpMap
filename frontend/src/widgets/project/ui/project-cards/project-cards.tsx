import { Empty, List, Row, Space, Switch } from "antd"
import { FolowProject } from "features/project"

import { ProjectCard } from "entities/project/ui"

import { useUserConfig } from "entities/user/model"

import { ContainerLoader } from "shared/ui"

import { useProjectsCards } from "widgets/project/model/use-projects-cards"

import styles from "./styles.module.css"

export const ProjectCards = () => {
  const { userConfig } = useUserConfig()
  const { isLoading, isLastPage, projects, bottomRef, onIsOnlyFavoriteClick, onShowArchived } =
    useProjectsCards()

  return (
    <div>
      <Row style={{ marginBottom: "16px", display: "flex", justifyContent: "right", gap: 20 }}>
        <Space align="baseline">
          Only favorites
          <Switch checked={userConfig.projects.is_only_favorite} onChange={onIsOnlyFavoriteClick} />
        </Space>
        <Space align="baseline">
          Show Archived
          <Switch checked={userConfig.projects.is_show_archived} onChange={onShowArchived} />
        </Space>
      </Row>
      {!isLoading && !projects.length && <Empty />}
      <div className={styles.list}>
        {projects.map((project) => (
          <List.Item key={project.id} id={`${project.name}-project-card`} style={{ width: "100%" }}>
            <ProjectCard project={project} folowProject={<FolowProject project={project} />} />
          </List.Item>
        ))}
        {!isLoading && !!projects.length && !isLastPage && (
          <div id="scroll-pagination-trigger-dashboard" ref={bottomRef} />
        )}
      </div>
      {isLoading && <ContainerLoader />}
    </div>
  )
}

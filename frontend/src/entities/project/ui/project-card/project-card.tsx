import { Card, Col, Row, Tag, Tooltip } from "antd"
import cn from "classnames"
import { RequestProjectAccess } from "features/project/request-access/request-access"
import { Link, LinkProps } from "react-router-dom"

import { colors } from "shared/config"
import { StatisticEntityInfo } from "shared/ui"

import { ProjectIcon } from "../project-icon"
import styles from "./styles.module.css"

interface Props {
  project: Project
  folowProject: React.ReactNode
}

const OptionalLink = (props: LinkProps & { visible: boolean }) => {
  const { visible, ...rest } = props
  if (!visible) {
    return <div>{props.children}</div>
  }
  return <Link {...rest} />
}

export const ProjectCard = ({ project, folowProject }: Props) => {
  return (
    <div className={styles.cardContainer}>
      <Card
        style={{ width: "100%" }}
        headStyle={{ padding: 0 }}
        title={
          <Row className={styles.itemBlock}>
            <Card.Meta
              className={`${styles.projectTitleBlock} ${
                project.is_archive ? styles.projectTitleBlockPie : styles.projectTitleBlockFull
              }`}
              avatar={<ProjectIcon icon={project.icon} name={project.name} size={32} />}
              title={
                <OptionalLink
                  visible={project.is_visible}
                  to={`/projects/${project.id}`}
                  className={styles.projectTitle}
                >
                  {project.name}
                </OptionalLink>
              }
            />
            {project.is_archive ? (
              <Tag style={{ marginLeft: "auto", maxWidth: "25%" }} color={colors.error}>
                Archived
              </Tag>
            ) : null}
          </Row>
        }
        extra={folowProject}
        actions={[
          <Tooltip title="Overview" key={0}>
            <OptionalLink
              visible={project.is_visible}
              to={`/projects/${project.id}`}
              id={`${project.name}-link-overview`}
            >
              Overview
            </OptionalLink>
          </Tooltip>,
          <Tooltip title="Test Suites" key={1}>
            <OptionalLink
              visible={project.is_visible}
              to={`/projects/${project.id}/suites`}
              id={`${project.name}-link-suites`}
            >
              Test Suites
            </OptionalLink>
          </Tooltip>,
          <Tooltip title="Test Plans" key={2}>
            <OptionalLink
              visible={project.is_visible}
              to={`/projects/${project.id}/plans`}
              id={`${project.name}-link-plans`}
            >
              Test Plans
            </OptionalLink>
          </Tooltip>,
        ]}
        className={cn({ [styles.cardBlured]: !project.is_visible })}
      >
        <Row gutter={20}>
          <Col span={12} className={styles.itemStatistic}>
            <StatisticEntityInfo title="Test Suites" count={project.suites_count} />
            <StatisticEntityInfo title="Test Cases" count={project.cases_count} />
          </Col>
          <Col span={12} className={`${styles.itemStatistic} ${styles.alignStart}`}>
            <StatisticEntityInfo title="Test Plans" count={project.plans_count} />
            <StatisticEntityInfo title="Tests" count={project.tests_count} />
          </Col>
        </Row>
      </Card>
      {!project.is_visible && <RequestProjectAccess project={project} />}
    </div>
  )
}

import { Card, Col, Row, Tag, Tooltip } from "antd"
import { Link } from "react-router-dom"

import { colors } from "shared/config"
import { StatisticEntityInfo } from "shared/ui"

import { ProjectIcon } from "../project-icon"
import styles from "./styles.module.css"

interface Props {
  project: Project
  folowProject: React.ReactNode
}

export const ProjectCard = ({ project, folowProject }: Props) => {
  return (
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
              <Link to={`/projects/${project.id}`} className={styles.projectTitle}>
                {project.name}
              </Link>
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
          <Link to={`/projects/${project.id}`} id={`${project.name}-link-overview`}>
            Overview
          </Link>
        </Tooltip>,
        <Tooltip title="Test Suites" key={1}>
          <Link to={`/projects/${project.id}/suites`} id={`${project.name}-link-suites`}>
            Test Suites
          </Link>
        </Tooltip>,
        <Tooltip title="Test Plans" key={2}>
          <Link to={`/projects/${project.id}/plans`} id={`${project.name}-link-plans`}>
            Test Plans
          </Link>
        </Tooltip>,
      ]}
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
  )
}

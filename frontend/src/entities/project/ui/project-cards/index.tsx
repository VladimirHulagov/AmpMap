import { Card, Col, List, Row, Space, Switch, Tag, Tooltip } from "antd"
import { Link } from "react-router-dom"

import { useProjectsCards } from "entities/project/model"

import { useUserConfig } from "entities/user/model"

import { colors } from "shared/config"
import { ContainerLoader } from "shared/ui"
import { BriefcaseIcon } from "shared/ui/icons"

import { FavoriteBtn } from "./favorite-btn"
import styles from "./styles.module.css"

export const ProjectCards = () => {
  const { userConfig } = useUserConfig()
  const { isLoading, projects, onFavoriteClick, onIsOnlyFavoriteClick, onShowArchived } =
    useProjectsCards()

  if (isLoading) {
    return <ContainerLoader />
  }

  return (
    <List
      rowKey="id"
      grid={{ gutter: 24, xxl: 3, xl: 2, lg: 2, md: 2, sm: 2, xs: 1 }}
      header={
        <Row style={{ marginBottom: "16px", display: "flex", justifyContent: "right", gap: 20 }}>
          <Space align="baseline">
            Only favorites
            <Switch
              checked={userConfig.projects.is_only_favorite}
              onChange={onIsOnlyFavoriteClick}
            />
          </Space>
          <Space align="baseline">
            Show Archived
            <Switch checked={userConfig.projects.is_show_archived} onChange={onShowArchived} />
          </Space>
        </Row>
      }
      dataSource={projects}
      renderItem={(item) => (
        <List.Item key={item.id} id={`${item.name}-project-card`}>
          <Card
            headStyle={{ padding: 0 }}
            title={
              <Row>
                <Card.Meta
                  style={{ marginLeft: 20, maxWidth: item.is_archive ? "75%" : "100%" }}
                  avatar={<BriefcaseIcon style={{ fontSize: 24 }} />}
                  title={item.name}
                />
                {item.is_archive ? (
                  <Tag style={{ marginLeft: "auto", maxWidth: "25%" }} color={colors.error}>
                    Archived
                  </Tag>
                ) : null}
              </Row>
            }
            extra={
              <FavoriteBtn
                onClick={() => onFavoriteClick(item.id)}
                projectId={item.id}
                projectName={item.name}
              />
            }
            actions={[
              <Tooltip title="Overview" key={0}>
                <Link to={`/projects/${item.id}`} id={`${item.name}-link-overview`}>
                  Overview
                </Link>
              </Tooltip>,
              <Tooltip title="Test Suites" key={1}>
                <Link to={`/projects/${item.id}/suites`} id={`${item.name}-link-suites`}>
                  Test Suites
                </Link>
              </Tooltip>,
              <Tooltip title="Test Plans" key={2}>
                <Link to={`/projects/${item.id}/plans`} id={`${item.name}-link-plans`}>
                  Test Plans
                </Link>
              </Tooltip>,
            ]}
          >
            <Row gutter={20}>
              <Col
                span={12}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyItems: "flex-end",
                  alignItems: "flex-end",
                }}
              >
                <div className={styles.statisticBlock}>
                  <span className={styles.statisticValue}>{item.suites_count}</span>
                  <span>Test Suites</span>
                </div>
                <div className={styles.statisticBlock}>
                  <span className={styles.statisticValue}>{item.cases_count}</span>
                  <span>Test Cases</span>
                </div>
              </Col>
              <Col
                span={12}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyItems: "flex-end",
                  alignItems: "flex-start",
                }}
              >
                <div className={styles.statisticBlock}>
                  <span className={styles.statisticValue}>{item.plans_count}</span>
                  <span>Test Plans</span>
                </div>
                <div className={styles.statisticBlock}>
                  <span className={styles.statisticValue}>{item.tests_count}</span>
                  <span>Tests</span>
                </div>
              </Col>
            </Row>
          </Card>
        </List.Item>
      )}
    />
  )
}

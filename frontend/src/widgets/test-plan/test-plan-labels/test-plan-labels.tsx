import { Col, Row, Switch, Typography } from "antd"

import { useLabels } from "entities/label/model"
import { Label } from "entities/label/ui"

import { colors } from "shared/config"
import { ContainerLoader } from "shared/ui"

import styles from "./styles.module.css"

interface TestPlanLabelsProps {
  testPlanId?: string
}

export const TestPlanLabels = ({ testPlanId }: TestPlanLabelsProps) => {
  const {
    selectedLabels,
    selectedNotlabels,
    toggleCondition,
    labels,
    isLoading,
    handleLableClick,
    handleConditionClick,
  } = useLabels({ testPlanId })

  if (isLoading || !labels) return <ContainerLoader />

  if (!labels.length) return null

  const selectedAll = selectedLabels.concat(selectedNotlabels)

  return (
    <div className={styles.wrapper}>
      <Row>
        <Col>
          <div className={`${styles.titleBlock} labels-switcher`}>
            <Typography.Title level={5} style={{ marginBottom: 0, marginTop: 0, marginRight: 6 }}>
              Labels
            </Typography.Title>
            <Switch
              disabled={selectedAll.length < 2}
              checkedChildren="or"
              unCheckedChildren="and"
              defaultChecked
              className={styles.switcher}
              checked={toggleCondition}
              onChange={handleConditionClick}
            />
          </div>
          <ul className={styles.list}>
            {labels.map((label) => {
              const color = selectedLabels.includes(String(label.id))
                ? colors.accent
                : selectedNotlabels.includes(String(label.id))
                  ? "line-through"
                  : undefined
              return (
                <li key={label.id}>
                  <Label
                    content={label.name}
                    color={color}
                    onClick={() => handleLableClick(String(label.id))}
                  />
                </li>
              )
            })}
          </ul>
        </Col>
      </Row>
    </div>
  )
}

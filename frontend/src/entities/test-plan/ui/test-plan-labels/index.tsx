import { Col, Row, Switch, Typography } from "antd"

import { useLabels } from "entities/label/model"
import { Label } from "entities/label/ui"

import { useGetTestPlanLabelsQuery } from "entities/test-plan/api"

import { colors } from "shared/config"
import { ContainerLoader } from "shared/ui"

import styles from "./styles.module.css"

interface TestPlanLabelsProps {
  testPlanId: string
}

export const TestPlanLabels = ({ testPlanId }: TestPlanLabelsProps) => {
  const { data: labels, isLoading } = useGetTestPlanLabelsQuery(testPlanId)
  const { labelsFilter, toggleCondition, handleLableClick, handleConditionClick } = useLabels()

  if (isLoading || !labels) return <ContainerLoader />

  if (!labels.length) return null

  return (
    <div className={styles.wrapper}>
      <Row>
        <Col>
          <div className={`${styles.titleBlock} labels-switcher`}>
            <Typography.Title level={5} style={{ marginBottom: 0, marginRight: 6 }}>
              Labels
            </Typography.Title>
            <Switch
              disabled={labelsFilter.length < 2}
              checkedChildren="or"
              unCheckedChildren="and"
              defaultChecked
              className={styles.switcher}
              checked={toggleCondition}
              onChange={handleConditionClick}
            />
          </div>
          <ul className={styles.list}>
            {labels.map((label) => (
              <li key={label.id}>
                <Label
                  content={label.name}
                  color={labelsFilter.includes(String(label.id)) ? colors.accent : undefined}
                  onClick={() => handleLableClick(String(label.id))}
                />
              </li>
            ))}
          </ul>
        </Col>
      </Row>
    </div>
  )
}

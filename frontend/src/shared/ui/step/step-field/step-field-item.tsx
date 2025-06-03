import { Collapse, Divider, Typography } from "antd"
import classNames from "classnames"

import { Attachment, Markdown } from "shared/ui"

import styles from "./styles.module.css"

interface StepFieldItemProps {
  step: Step
}

export const StepFieldItem = ({ step }: StepFieldItemProps) => {
  return (
    <li id={`step-item-${step.name}`} className={styles.fieldItem}>
      <div className={styles.fieldIcon}>{step.sort_order}</div>
      <div className={styles.fieldWrapper}>
        <Collapse ghost style={{ padding: 0, margin: 0 }}>
          <Collapse.Panel
            id="steps-collapse"
            className={classNames("collapse-wrapper", styles.stepsCollapseWrapper)}
            header={
              <Typography.Title
                level={5}
                style={{ marginTop: 0, marginBottom: 0 }}
                data-testid={`step-name-${step.name}`}
              >
                {step.name}
              </Typography.Title>
            }
            key="1"
          >
            <div className={styles.fieldContent}>
              <Divider
                orientation="left"
                style={{ margin: 0, marginTop: 14 }}
                orientationMargin={0}
              >
                Scenario
              </Divider>
              <div className="content markdown">
                <Markdown content={step.scenario} />
              </div>
            </div>

            {step.expected && (
              <div className={styles.fieldContent}>
                <Divider
                  orientation="left"
                  style={{ margin: 0, marginTop: 0 }}
                  orientationMargin={0}
                >
                  Expected
                </Divider>
                <div className="content markdown">
                  <Markdown content={step.expected ?? ""} />
                </div>
              </div>
            )}

            {!!step.attachments.length && (
              <div style={{ marginTop: 14 }} data-testid={`${step.name}-step-attachments-list`}>
                <Attachment.Field attachments={step.attachments} />
              </div>
            )}
          </Collapse.Panel>
        </Collapse>
      </div>
    </li>
  )
}

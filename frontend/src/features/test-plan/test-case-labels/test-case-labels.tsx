import { Tooltip, Typography } from "antd"

import { Label } from "entities/label/ui"

import styles from "./test-case-labels.module.css"

interface LabelProps {
  labels: string[]
}

const MAX_SHOW_LABELS = 3

export const TestCaseLabels = ({ labels }: LabelProps) => {
  const shownLabels = labels.slice(0, MAX_SHOW_LABELS)

  return (
    <div className={styles.labels}>
      {shownLabels.map((label) => (
        <Label key={label} content={label} />
      ))}
      {labels.length > MAX_SHOW_LABELS && (
        <Tooltip title={`Labels: ${labels.join(", ")}`}>
          <Typography.Text className={styles.extra}>
            {/* {`+ ${labels.length - MAX_SHOW_LABELS}`} */}
            ...
          </Typography.Text>
        </Tooltip>
      )}
    </div>
  )
}

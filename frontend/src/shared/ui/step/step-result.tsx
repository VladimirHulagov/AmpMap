import { getStatusTextByNumber } from "shared/libs"
import { Status } from "shared/ui"

import styles from "./styles.module.css"

interface StepResultProps {
  stepsResult: StepResult[]
}

export const StepResult = ({ stepsResult }: StepResultProps) => {
  return (
    <ul style={{ paddingLeft: 0 }} className={styles.fieldUl}>
      {[...stepsResult]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((stepResult) => (
          <li className={styles.resultFieldItem} key={stepResult.id}>
            <div className={styles.resultFieldIcon}>{stepResult.sort_order}</div>
            <div className={styles.resultFieldWrapper}>
              <span>{stepResult.name}</span>
            </div>
            <div className={styles.resultStatus}>
              <Status value={getStatusTextByNumber(stepResult.status)} />
            </div>
          </li>
        ))}
    </ul>
  )
}

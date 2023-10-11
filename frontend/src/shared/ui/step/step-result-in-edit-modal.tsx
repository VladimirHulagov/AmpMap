import { Select } from "antd"

import { statusesWithoutUntested } from "shared/config"

import styles from "./styles.module.css"

interface StepResultProps {
  stepResultsData: StepResult[]
  stepResults: {
    [stepId: string]: string
  }
  setStepsResult: React.Dispatch<
    React.SetStateAction<{
      [stepId: string]: string
    }>
  >
}

export const StepResultInEditModal = ({
  stepResultsData,
  stepResults,
  setStepsResult,
}: StepResultProps) => {
  const handleStepChange = (stepId: string, value: string) => {
    setStepsResult((prevState) => ({ ...prevState, [stepId]: value }))
  }

  if (!stepResultsData.length) return <></>

  return (
    <ul style={{ paddingLeft: 0 }} className={styles.fieldUl}>
      {[...stepResultsData]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => (
          <li className={styles.resultFieldItem} key={item.id}>
            <div className={styles.resultFieldIcon}>{item.sort_order}</div>
            <div className={styles.resultModalFieldWrapper}>
              <div className={styles.resultModalFieldContent}>
                <div>{item.name}</div>
              </div>
            </div>
            <div className={styles.resultSelect}>
              <Select
                value={stepResults[item.id]}
                placeholder="Please select"
                style={{ width: "100%" }}
                options={statusesWithoutUntested}
                onSelect={(value) => handleStepChange(String(item.id), String(value))}
                defaultValue={statusesWithoutUntested[1].value}
              />
            </div>
          </li>
        ))}
    </ul>
  )
}

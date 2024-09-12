import { Select } from "antd"
import { useStatuses } from "entities/status/model/use-statuses"

import styles from "./styles.module.css"

interface StepResultProps {
  testCase: TestCase
  steps: Record<string, number>
  setSteps: React.Dispatch<React.SetStateAction<Record<string, number>>>
}

export const StepResultInCreateModal = ({ testCase, steps, setSteps }: StepResultProps) => {
  const { statusesOptions, getStatusById } = useStatuses({ project: testCase.project })

  if (!testCase.steps) return <></>

  const handleChange = (stepId: string, statusIdStr: string) => {
    const statusId = parseInt(statusIdStr)
    const status = getStatusById(statusId)
    if (!status) return

    setSteps((prevState) => ({ ...prevState, [stepId]: status.id }))
  }

  return (
    <ul style={{ paddingLeft: 0 }} className={styles.fieldUl}>
      {testCase.steps.map((item) => {
        return (
          <li id={`step-item-${item.name}`} className={styles.resultFieldItem} key={item.id}>
            <div className={styles.resultFieldIcon}>{item.sort_order}</div>
            <div className={styles.resultModalFieldWrapper}>
              <div className={styles.resultModalFieldContent}>
                <div>{item.name}</div>
              </div>
            </div>
            <div className={styles.resultSelect}>
              <Select
                value={steps[item.id]}
                placeholder="Please select"
                style={{ width: "100%" }}
                options={statusesOptions}
                onSelect={(statusIdStr) => handleChange(item.id, statusIdStr.toString())}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

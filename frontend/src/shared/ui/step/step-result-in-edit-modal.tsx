import { Select } from "antd"
import { useStatuses } from "entities/status/model/use-statuses"
import { useParams } from "react-router-dom"

import styles from "./styles.module.css"

interface StepResultProps {
  stepResultsData: StepResult[]
  stepResults: Record<string, number>
  setStepsResult: React.Dispatch<React.SetStateAction<Record<string, number>>>
}

export const StepResultInEditModal = ({
  stepResultsData,
  stepResults,
  setStepsResult,
}: StepResultProps) => {
  const { projectId } = useParams<ParamProjectId>()
  const { statusesOptions } = useStatuses({ project: projectId })
  const handleStepChange = (stepId: string, value: number) => {
    setStepsResult((prevState) => ({ ...prevState, [stepId]: value }))
  }

  if (!stepResultsData.length) return <></>

  return (
    <ul style={{ paddingLeft: 0 }} className={styles.fieldUl}>
      {[...stepResultsData]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => (
          <li id={`step-item-${item.name}`} className={styles.resultFieldItem} key={item.id}>
            <div className={styles.resultFieldIcon}>{item.sort_order}</div>
            <div className={styles.resultModalFieldWrapper}>
              <div className={styles.resultModalFieldContent}>
                <div>{item.name}</div>
              </div>
            </div>
            <div className={styles.resultSelect}>
              <Select
                value={stepResults[item.id] ?? null}
                placeholder="Please select"
                style={{ width: "100%" }}
                options={statusesOptions}
                onSelect={(value) => handleStepChange(String(item.id), value)}
              />
            </div>
          </li>
        ))}
    </ul>
  )
}

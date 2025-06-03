import { UseFieldArrayReturn, useFormContext } from "react-hook-form"
import { ReactSortable } from "react-sortablejs"

import { AddStep } from "entities/test-case/ui/steps/add-step"

import { StepsFormControllerItem } from "./steps-form-controller-item"
import styles from "./styles.module.css"

interface Props {
  fieldArray: UseFieldArrayReturn<TestCaseFormData, "steps", "extraId">
  expandedSteps: number[]
  onToggleExpanded: (id: number) => void
}

export const StepsFormController = ({ fieldArray, expandedSteps, onToggleExpanded }: Props) => {
  const { getValues } = useFormContext<TestCaseFormData>()
  const { fields, append, remove, insert, update } = fieldArray

  const handleCreateStep = () => {
    append({
      id: new Date().getTime(),
      name: "",
      scenario: "",
      expected: "",
      sort_order: fields.length + 1,
      attachments: [],
      isNew: true,
    })
  }

  const handleClickCopyStep = (stepIndex: number) => {
    const currentSteps = getValues("steps") ?? []
    const stepToCopy = currentSteps[stepIndex]

    const newStep = {
      ...stepToCopy,
      id: new Date().getTime(),
      name: `${stepToCopy.name} (Copy)`,
      isNew: true,
    }

    insert(stepIndex + 1, newStep)
  }

  const handleUpdateListOrder = (stepList: Step[]) => {
    stepList.forEach((step, index) => {
      const prevStepState = getValues("steps")?.find((pStep) => pStep.id === step.id) ?? step
      update(index, { ...prevStepState, sort_order: index + 1 })
    })
  }

  return (
    <>
      <ReactSortable
        tag="ul"
        className={styles.ul}
        list={fields.map((i) => ({ ...i, chosen: false }))}
        setList={handleUpdateListOrder}
        animation={150}
        ghostClass={styles.ghostClass}
        handle=".handle"
        id="test-case-steps"
      >
        {fields.map((step, index) => {
          const isExpanded = expandedSteps.includes(fields[index].id)
          return (
            <StepsFormControllerItem
              key={step.id}
              isExpanded={isExpanded}
              index={index}
              step={step}
              onToggleExpanded={() => onToggleExpanded(step.id)}
              onCopyStep={() => handleClickCopyStep(index)}
              onDeleteStep={() => remove(index)}
            />
          )
        })}
      </ReactSortable>
      <AddStep onClick={handleCreateStep} />
    </>
  )
}

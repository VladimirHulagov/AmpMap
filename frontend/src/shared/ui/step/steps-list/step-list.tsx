import { Button, Flex } from "antd"
import { useStatuses } from "entities/status/model/use-statuses.tsx"
import { ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"

import CollapseIcon from "shared/assets/yi-icons/collapse-3.svg?react"
import ExpandIcon from "shared/assets/yi-icons/expand-2.svg?react"

import { Step } from "../step"
import styles from "./styles.module.css"

interface Props {
  steps: Step[]
  label: ReactNode
  labelExtra?: ReactNode
  actions?: {
    onChangeStatus?: (statuses: Record<string, number>) => void
  }
  stepStatuses?: Record<number, number>
  project?: number
  result?: Result
  id: string
}

export const StepList = ({
  steps,
  actions,
  labelExtra,
  label,
  project,
  stepStatuses,
  result,
  id,
}: Props) => {
  const { t } = useTranslation()

  const [expandedSteps, setExpandedSteps] = useState<number[]>([])
  const { statusesOptions, getStatusById } = useStatuses({ project })

  const handleCollapse = () => {
    setExpandedSteps([])
  }

  const handleExpand = () => {
    setExpandedSteps(steps.map(({ id: stepId }) => stepId))
  }

  const handleToggleExpanded = (stepId: number) => {
    if (expandedSteps.includes(stepId)) {
      setExpandedSteps((prev) => prev.filter((expandedStepId) => stepId !== expandedStepId))
      return
    }

    setExpandedSteps((prev) => [stepId, ...prev])
  }

  const handleStatusChange = (testCaseStepId: number, statusIdStr: string) => {
    const statusId = parseInt(statusIdStr)
    const status = getStatusById(statusId)
    if (!status) return

    const resultStepId = result?.steps_results?.find(
      (stepResult) => stepResult.step === testCaseStepId
    )?.id

    actions?.onChangeStatus?.({ ...stepStatuses, [resultStepId ?? testCaseStepId]: status.id })
  }

  const stepElements = steps.map((testCaseStep, index) => {
    const resultStepId = result?.steps_results?.find(({ step }) => step === testCaseStep.id)?.id

    return (
      <Step
        key={testCaseStep.id}
        id={`${id}-step-${testCaseStep.name}`}
        isExpanded={expandedSteps.includes(testCaseStep.id)}
        onToggleExpanded={handleToggleExpanded}
        actions={{
          ...actions,
          onChangeStatus: actions?.onChangeStatus && handleStatusChange,
        }}
        step={testCaseStep}
        index={index}
        statusesOptions={statusesOptions}
        status={stepStatuses?.[resultStepId ?? testCaseStep.id]}
      />
    )
  })

  return (
    <Flex vertical>
      <Flex
        style={{ width: "100%", userSelect: "none" }}
        align="center"
        justify="space-between"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {label}
        <Button
          type="text"
          className={styles.labelButton}
          icon={<ExpandIcon width={16} height={16} />}
          onClick={handleExpand}
          data-testid={`${id}-expand-steps`}
        >
          {t("Expand")}
        </Button>
        <Button
          type="text"
          className={styles.labelButton}
          icon={<CollapseIcon width={16} height={16} />}
          onClick={handleCollapse}
          data-testid={`${id}-collapse-steps`}
        >
          {t("Collapse")}
        </Button>
        <div className={styles.line} />
        {labelExtra}
      </Flex>
      <Flex style={{ marginTop: 8 }} vertical>
        {stepElements}
      </Flex>
    </Flex>
  )
}

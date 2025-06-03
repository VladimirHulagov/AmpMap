import { useTranslation } from "react-i18next"

import { useGetLabelsQuery } from "entities/label/api"
import { LabelList } from "entities/label/ui"

import { useProjectContext } from "pages/project"

import { colors } from "shared/config"

import { Label } from "../label"

export interface LabelFilterValue {
  labels: number[]
  not_labels: number[]
  labels_condition: LabelCondition
}

interface Props {
  value: LabelFilterValue
  onChange: (value: LabelFilterValue) => void
}

export const LabelFilter = ({ value, onChange }: Props) => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { data, isLoading } = useGetLabelsQuery({ project: project.id.toString() })

  const handleLableClick = (label: LabelInForm) => {
    const labelId = Number(label.id)
    const findLabel = value.labels.find((i) => i === labelId)
    const findNotLabel = value.not_labels.find((i) => i === labelId)

    if (!findLabel && !findNotLabel) {
      const newState = { ...value, labels: [...value.labels, labelId] }
      onChange(newState)
      return
    }

    if (findLabel) {
      const newState = {
        ...value,
        labels: value.labels.filter((i) => i !== labelId),
        not_labels: [...value.not_labels, labelId],
      }
      onChange(newState)
      return
    }

    if (findNotLabel) {
      const newState: LabelFilterValue = {
        ...value,
        labels: value.labels.filter((i) => i !== labelId),
        not_labels: value.not_labels.filter((i) => i !== labelId),
      }
      onChange(newState)
      return
    }
  }

  return (
    <LabelList id="label-filter" isLoading={isLoading} showMore={{ text: t("Show more") }}>
      {(data ?? []).map((label) => {
        const hasInLabels = value.labels.some((i) => i === label.id)
        const hasInNotLabels = value.not_labels.some((i) => i === label.id)
        const color = hasInLabels ? colors.accent : hasInNotLabels ? "line-through" : undefined

        return (
          <li key={label.id} data-testid={`label-filter-label-${label.name}`}>
            <Label content={label.name} color={color} onClick={() => handleLableClick(label)} />
          </li>
        )
      })}
    </LabelList>
  )
}

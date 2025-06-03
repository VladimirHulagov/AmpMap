import { CopyOutlined } from "@ant-design/icons"
import { Popconfirm, Tooltip } from "antd"
import { PopconfirmProps } from "antd/lib"
import { useTranslation } from "react-i18next"

import DeleteIcon from "shared/assets/yi-icons/delete.svg?react"
import DotsIcon from "shared/assets/yi-icons/dots-2.svg?react"
import { Button } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  step: Step
  onCopy: (step: Step) => void
  onDelete: (id: number) => void
}

export const StepActions = ({ step, onCopy, onDelete }: Props) => {
  const { t } = useTranslation()

  const handleConfirm: PopconfirmProps["onConfirm"] = () => {
    onDelete(step.id)
  }

  return (
    <div className={styles.actions}>
      <Tooltip title={t("Copy Step")}>
        <Button
          id={`${step.name}-copy`}
          onClick={(e) => {
            e.stopPropagation()
            onCopy(step)
          }}
          size="m"
          shape="circle"
          color="ghost"
          icon={<CopyOutlined style={{ fontSize: 14 }} />}
          data-testid={`test-case-step-${step.sort_order}-copy-button`}
        />
      </Tooltip>
      <Tooltip title={t("Delete Step")}>
        <Popconfirm
          placement="topRight"
          title={t("Delete the step")}
          description={t("Are you sure to delete this step?")}
          onConfirm={handleConfirm}
          onCancel={(e) => e?.stopPropagation()}
          okText={t("Yes")}
          cancelText={t("No")}
        >
          <Button
            id={`${step.name}-delete`}
            danger
            size="m"
            shape="circle"
            color="ghost"
            onClick={(e) => {
              e.stopPropagation()
            }}
            icon={<DeleteIcon width={20} height={20} />}
            data-testid={`test-case-step-${step.sort_order}-delete-button`}
          />
        </Popconfirm>
      </Tooltip>
      <Tooltip title={t("Move Step")}>
        <Button
          id={`${step.name}-move`}
          className="handle"
          size="m"
          shape="circle"
          color="ghost"
          icon={<DotsIcon width={20} height={20} />}
          data-testid={`test-case-step-${step.sort_order}-move-button`}
        />
      </Tooltip>
    </div>
  )
}

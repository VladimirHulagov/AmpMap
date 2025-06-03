import { CopyOutlined, EditOutlined } from "@ant-design/icons"
import { Button, Flex, Popconfirm, Select, Tooltip } from "antd"
import { PopconfirmProps } from "antd/lib"
import classNames from "classnames"
import { useTranslation } from "react-i18next"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import DeleteIcon from "shared/assets/yi-icons/delete.svg?react"
import DotsIcon from "shared/assets/yi-icons/dots-2.svg?react"
import { Attachment } from "shared/ui/attachment"
import { Markdown } from "shared/ui/markdown"
import { PlaceholderStatus, Status } from "shared/ui/status"

import styles from "./styles.module.css"

interface Props {
  step: Step
  index: number
  actions?: {
    onClickCopy?: (step: Step) => void
    onClickEdit?: (step: Step) => void
    onClickDelete?: (id: number) => void
    onChangeStatus?: (stepId: number, statusIdStr: string) => void
    move?: boolean
  }
  isExpanded: boolean
  onToggleExpanded: (id: number) => void
  status?: number
  statusesOptions?: StatusOption[]
  id: string
}

export const Step = ({
  index,
  actions,
  step,
  isExpanded,
  onToggleExpanded,
  status,
  statusesOptions,
  id: extraId,
}: Props) => {
  const { t } = useTranslation()

  const handleConfirm: PopconfirmProps["onConfirm"] = () => {
    actions?.onClickDelete?.(step.id)
  }

  const selectedOption = statusesOptions?.find(({ id }) => id === status)

  return (
    <li
      className={classNames(styles.item, { [styles.expanded]: isExpanded })}
      key={step.id}
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <Flex vertical gap={12} style={{ width: "100%" }}>
        <Flex align="flex-start">
          <div className={styles.stepBlock}>
            {actions && (
              <div className={styles.actions}>
                {actions?.onClickEdit && (
                  <Tooltip title={t("Edit Step")}>
                    <Button
                      id={`${step.name}-edit`}
                      onClick={() => {
                        actions.onClickEdit?.(step)
                      }}
                      size="small"
                      className={styles.actionButton}
                      data-testid={`${extraId}-edit-button`}
                      icon={<EditOutlined className={styles.actionIcon} />}
                    />
                  </Tooltip>
                )}
                {actions?.onClickCopy && (
                  <Tooltip title={t("Copy Step")}>
                    <Button
                      id={`${step.name}-copy`}
                      onClick={() => {
                        actions.onClickCopy?.(step)
                      }}
                      shape="circle"
                      size="small"
                      data-testid={`${extraId}-copy-button`}
                      className={styles.actionButton}
                      icon={<CopyOutlined className={styles.actionIcon} />}
                    />
                  </Tooltip>
                )}
                {actions?.onClickDelete && (
                  <Tooltip title={t("Delete Step")}>
                    <Popconfirm
                      id={`${extraId}-delete-popconfirm`}
                      placement="topRight"
                      title={t("Delete the step")}
                      description={t("Are you sure to delete this step?")}
                      onConfirm={handleConfirm}
                      okText={t("Yes")}
                      cancelText={t("No")}
                      okButtonProps={{ "data-testid": "confirm-delete-step-button" }}
                      cancelButtonProps={{ "data-testid": "cancel-delete-step-button" }}
                    >
                      <Button
                        id={`${step.name}-delete`}
                        data-testid={`${extraId}-delete-button`}
                        className={styles.actionButton}
                        danger
                        size="small"
                        shape="circle"
                        icon={
                          <DeleteIcon
                            width={20}
                            height={20}
                            className={classNames(styles.actionIcon, styles.deleteActionIcon)}
                          />
                        }
                      />
                    </Popconfirm>
                  </Tooltip>
                )}
                {actions?.move && (
                  <Tooltip title={t("Move Step")}>
                    <Button
                      id={`${step.name}-move`}
                      data-testid={`${extraId}-move-button`}
                      className={classNames("handle", styles.actionButton)}
                      size="small"
                      icon={<DotsIcon width={20} height={20} className={styles.actionIcon} />}
                    />
                  </Tooltip>
                )}
                {actions?.onChangeStatus && (
                  <div className={styles.resultSelect}>
                    <Select
                      popupClassName={`${extraId}-statuses-list`}
                      data-testid={`${extraId}-statuses-list`}
                      value={status}
                      placeholder={
                        <div className={styles.statusWrapper}>
                          <PlaceholderStatus placeholder={t("Set Status")} />
                          <ArrowIcon
                            className={styles.statusArrow}
                            width={16}
                            height={16}
                            data-testid={`${extraId}-statuses-list-placeholder-arrow`}
                            style={{ color: "var(--y-grey-75)" }}
                          />
                        </div>
                      }
                      className={styles.statusSelect}
                      onSelect={(statusId) =>
                        actions?.onChangeStatus?.(step.id, statusId.toString())
                      }
                      labelRender={(option) => {
                        return (
                          <div
                            className={styles.statusWrapper}
                            data-testid={`${extraId}-selected-status`}
                          >
                            {option.label}
                            <ArrowIcon
                              className={styles.statusArrow}
                              width={16}
                              height={16}
                              data-testid={`${extraId}-selected-status-arrow`}
                            />
                          </div>
                        )
                      }}
                      suffixIcon={null}
                      id={`create-result-step-${step.name}`}
                    >
                      {statusesOptions?.map((option) => (
                        <Select.Option key={option.id} value={option.id}>
                          <Status
                            id={option.id}
                            name={option.label}
                            color={option.color}
                            extraId={extraId}
                          />
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                )}
                {selectedOption && !actions.onChangeStatus && (
                  <Status
                    id={selectedOption.id}
                    name={selectedOption.label}
                    color={selectedOption.color}
                    extraId={`${extraId}-selected-status`}
                  />
                )}
              </div>
            )}
            <div className={styles.stepIndex}>{index + 1}</div>{" "}
            <span className={styles.stepName} data-testid={extraId}>
              {step.name}
            </span>
          </div>
        </Flex>
        {isExpanded && (
          <div style={{ paddingRight: 8 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{t("Scenario")}</div>
              <div data-testid={`${extraId}-scenario`}>
                <Markdown content={step.scenario} />
              </div>
            </div>
            {step.expected && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{t("Expected")}</div>
                <div data-testid={`${extraId}-expected`}>
                  <Markdown content={step.expected} />
                </div>
              </div>
            )}
            {!!step.attachments.length && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{t("Attachments")}</div>
                <Attachment.List attachments={step.attachments} id={extraId} />
              </div>
            )}
          </div>
        )}
      </Flex>
      <ArrowIcon
        className={classNames(styles.arrow, { [styles.expanded]: isExpanded })}
        width={24}
        height={24}
        onClick={() => onToggleExpanded(step.id)}
        data-testid={`${extraId}-arrow-icon`}
      />
    </li>
  )
}

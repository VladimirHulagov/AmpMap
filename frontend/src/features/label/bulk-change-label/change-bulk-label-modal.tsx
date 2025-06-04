import { Alert, Flex, Form, Modal, Select } from "antd"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useGetLabelsQuery } from "entities/label/api"
import { useTestCaseFormLabels } from "entities/label/model"
import { Label, LabelList, LabelWrapper } from "entities/label/ui"

import { useProjectContext } from "pages/project"

import { colors } from "shared/config"
import { ErrorObj, useErrors } from "shared/hooks"
import { antdNotification } from "shared/libs/antd-modals"
import { AlertError, Button } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  isShow: boolean
  onClose: () => void
  onSubmit: (labels: LabelInForm[], operationType: ChangeLabelBulkOperationType) => Promise<void>
  selectedCount: number
}

interface ErrorData {
  labels?: string
}

const BULK_OPERATION_TYPES = ["add", "update", "delete", "clear"] as const
const TEST_ID = "change-bulk-label"

type BulkOperation = (typeof BULK_OPERATION_TYPES)[number]

export const ChangeBulkLabelModal = ({ isShow, onClose, selectedCount, onSubmit }: Props) => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation>("add")
  const [isUpdating, setIsUpdating] = useState(false)
  const { data, isLoading: isLoadingLabels } = useGetLabelsQuery({ project: project.id.toString() })
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)

  const operationsLabel = {
    add: t("Add to existing"),
    update: t("Replace all with new"),
    delete: t("Find and remove label"),
    clear: t("Remove all labels"),
  }

  const operationOptions = BULK_OPERATION_TYPES.map((operation) => ({
    label: operationsLabel[operation],
    value: operation,
  }))

  const labelProps = useTestCaseFormLabels({
    setValue: () => {},
    testCase: null,
    isEditMode: false,
  })

  useEffect(() => {
    labelProps.handleClearLabels()
  }, [selectedOperation])

  const handleSubmit = async () => {
    setErrors(null)
    try {
      setIsUpdating(true)

      const operation = selectedOperation === "clear" ? "update" : selectedOperation

      await onSubmit(labelProps.labels, operation)

      antdNotification.success("change-bulk-label", {
        description: t("Labels changed successfully"),
      })
      onClose()
    } catch (err) {
      onHandleError(err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLabelClick = ({ name, id }: LabelInForm) => {
    if (!labelProps.labels.find((label) => label.id === id)) {
      labelProps.handleAddLabel(name)
    }
  }

  return (
    <Modal
      title={
        <div className={styles.header}>
          <div className={styles.title}>{t("Change Labels")}</div>
          <div className={styles.subTitle}>{`${selectedCount} ${t("Items")}`}</div>
        </div>
      }
      open={isShow}
      onCancel={onClose}
      centered
      width={478}
      styles={{
        content: { padding: "20px 0 16px", height: "100%" },
        body: { minHeight: 296 },
        header: { margin: 0 },
      }}
      footer={[
        <div key="footer" className={styles.formFooter}>
          <Button
            data-testid="close-bulk-add-labels-modal"
            onClick={onClose}
            loading={isUpdating}
            color="secondary-linear"
          >
            {t("Cancel")}
          </Button>
          <Button
            data-testid="submit-bulk-add-labels-modal"
            loading={isUpdating}
            onClick={handleSubmit}
            disabled={labelProps.labels.length === 0 && selectedOperation !== "clear"}
            color="accent"
          >
            {t("Submit")}
          </Button>
        </div>,
      ]}
    >
      {errors ? <AlertError error={errors as ErrorObj} /> : null}
      <Flex vertical style={{ padding: "24px" }} justify={"start"}>
        <Form.Item label={t("Action")} layout="vertical">
          <Select
            data-testid={`${TEST_ID}-action-select`}
            onSelect={(operation) => setSelectedOperation(operation as BulkOperation)}
            value={selectedOperation}
            style={{ width: "100%" }}
            options={operationOptions}
          />
        </Form.Item>
        {selectedOperation !== "clear" && (
          <Form.Item label={t("Labels")} layout="vertical">
            <LabelWrapper
              labelProps={labelProps}
              disabled={!selectedOperation}
              noAdding={selectedOperation === "delete"}
            />
            <LabelList
              id="bulk-add-label-list"
              isLoading={isLoadingLabels}
              showMore={{ text: t("Show All"), styles: { margin: "8px auto 0 0" } }}
            >
              {(data ?? []).map((label) => {
                const isSelected = labelProps.labels.some(({ id }) => label.id === id)

                return (
                  <li key={label.id} data-testid={`bulk-add-label-list-${label.name}`}>
                    <Label
                      color={isSelected ? colors.primary : undefined}
                      content={label.name}
                      onClick={() => handleLabelClick(label)}
                      className={styles.label}
                    />
                  </li>
                )
              })}
            </LabelList>
          </Form.Item>
        )}
        {selectedOperation === "clear" && (
          <Alert message={t("All labels of the selected entities will be removed")} banner />
        )}
      </Flex>
    </Modal>
  )
}

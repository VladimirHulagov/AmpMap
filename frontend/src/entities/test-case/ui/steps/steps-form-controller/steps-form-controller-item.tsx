import { Flex, Form, Input } from "antd"
import classNames from "classnames"
import { useEffect, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useAttachments } from "entities/attachment/model"

import { useProjectContext } from "pages/project"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { Attachment, TextAreaWithAttach } from "shared/ui"
import { StepActions } from "shared/ui/step/step-actions/step-actions"

import styles from "./styles.module.css"

interface Props {
  step: Step
  index: number
  isExpanded: boolean
  onToggleExpanded: () => void
  onCopyStep: () => void
  onDeleteStep: () => void
}

export const StepsFormControllerItem = ({
  step,
  index,
  isExpanded,
  onToggleExpanded,
  onCopyStep,
  onDeleteStep,
}: Props) => {
  const { t } = useTranslation()
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<TestCaseFormData>()
  const project = useProjectContext()
  const { attachments, attachmentsIds, setAttachments, onRemove, onLoad, onChange } =
    useAttachments<TestCaseFormData>(control, project.id, `steps.${index}.attachments`)

  const stepErrors = errors?.steps?.[index]
  const hasErrors = stepErrors?.scenario !== undefined || stepErrors?.name !== undefined
  const [wasExpandedDueToError, setWasExpandedDueToError] = useState(false)

  useEffect(() => {
    if (hasErrors && !isExpanded && !wasExpandedDueToError) {
      onToggleExpanded()
      setWasExpandedDueToError(true)
    }
  }, [hasErrors, isExpanded, onToggleExpanded, wasExpandedDueToError])

  useEffect(() => {
    setValue(`steps.${index}.attachments`, attachments)
  }, [attachments, index])

  useEffect(() => {
    if (step.attachments.length && !attachments.length) {
      setAttachments(step.attachments as IAttachmentWithUid[])
    }
  }, [step])

  return (
    <li
      key={step.id}
      className={classNames(styles.item, { [styles.expanded]: isExpanded })}
      data-testid={`test-case-step-${index + 1}`}
    >
      <Flex vertical gap={12} style={{ width: "100%" }}>
        <Flex>
          <Flex align="center" style={{ alignSelf: "flex-start", height: 32 }}>
            <ArrowIcon
              className={classNames(styles.arrow, { [styles.expanded]: isExpanded })}
              width={24}
              height={24}
              onClick={onToggleExpanded}
            />
            <div className={styles.stepIndex}>{index + 1}</div>
          </Flex>
          <Flex vertical style={{ width: "100%" }}>
            <Flex>
              <Form.Item required style={{ marginBottom: 0, width: "100%" }}>
                <Controller
                  name={`steps.${index}.name`}
                  control={control}
                  rules={{ required: t("Required field") }}
                  render={({ field: fieldController }) => (
                    <Input
                      key={String(step.id)}
                      data-testid={`test-case-step-${step.sort_order}-name-input`}
                      {...fieldController}
                    />
                  )}
                />
              </Form.Item>
              <StepActions step={step} onCopy={onCopyStep} onDelete={onDeleteStep} />
            </Flex>
            <Controller
              name={`steps.${index}.scenario`}
              control={control}
              rules={{ required: t("Required field") }}
              render={({ field: fieldController }) => (
                <Form.Item
                  validateStatus={errors?.steps?.[index]?.scenario ? "error" : ""}
                  help={errors?.steps?.[index]?.scenario?.message ?? ""}
                  label={t("Scenario")}
                  required
                  style={{
                    marginTop: 16,
                    marginBottom: 0,
                    width: "100%",
                    display: isExpanded ? "block" : "none",
                  }}
                >
                  <TextAreaWithAttach
                    uploadId={`step-${step.sort_order}-scenario`}
                    textAreaId={`step-${step.sort_order}-scenario`}
                    fieldProps={fieldController}
                    stateAttachments={{ attachments, setAttachments }}
                    customRequest={onLoad}
                    setValue={setValue}
                    style={{ width: "100%" }}
                    data-testid={`test-case-step-${step.sort_order}-scenario-input`}
                  />
                </Form.Item>
              )}
            />
            <Flex
              vertical
              style={{
                marginTop: 16,
                width: "100%",
                gap: 16,
                display: isExpanded ? "flex" : "none",
              }}
            >
              <Flex vertical>
                <Form.Item label={t("Expected")} style={{ marginBottom: 0, width: "100%" }}>
                  <Controller
                    name={`steps.${index}.expected`}
                    control={control}
                    render={({ field: fieldController }) => (
                      <TextAreaWithAttach
                        uploadId={`step-${step.sort_order}-expected`}
                        textAreaId={`step-${step.sort_order}-expected`}
                        fieldProps={fieldController}
                        stateAttachments={{ attachments, setAttachments }}
                        customRequest={onLoad}
                        setValue={setValue}
                        style={{ width: "100%" }}
                        data-testid={`test-case-step-${step.sort_order}-expected-input`}
                      />
                    )}
                  />
                </Form.Item>
              </Flex>
              <Attachment.DropFilesMin
                attachments={attachments}
                attachmentsIds={attachmentsIds}
                onChange={onChange}
                onLoad={onLoad}
                onRemove={onRemove}
                register={register}
                registerKey={(indexAttachment) => `steps.${index}.attachments.${indexAttachment}`}
                id={`step-${step.sort_order}-attachments`}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </li>
  )
}

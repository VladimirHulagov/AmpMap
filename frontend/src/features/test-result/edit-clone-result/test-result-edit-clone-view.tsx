import { Collapse, Flex, Form, Row, Select, Typography } from "antd"
import classNames from "classnames"
import { CustomAttributeAdd, CustomAttributeForm } from "entities/custom-attribute/ui"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TestDetailInfo } from "entities/test/ui"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import CloseIcon from "shared/assets/yi-icons/close.svg?react"
import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError, Attachment, Button, Status, Steps, TextAreaWithAttach } from "shared/ui"

import { ApplyToStepsButton } from "../apply-to-steps-button/apply-to-steps-button"
import styles from "./styles.module.css"
import { useEditCloneResultModal } from "./use-edit-clone-result-modal"

interface TestResultEditCopyModalProps {
  onCancel: () => void
  testResult: Result
  testCase: TestCase
  isClone: boolean
  onSubmit?: (newResult: Result, oldResult: Result) => void
  onDirtyChange: (dirty: boolean) => void
}

export const TestResultEditCloneView = ({
  onCancel,
  testResult,
  testCase,
  isClone,
  onSubmit,
  onDirtyChange,
}: TestResultEditCopyModalProps) => {
  const { t } = useTranslation()
  const {
    isLoading,
    errors,
    attachments,
    attachmentsIds,
    control,
    attributes,
    watchSteps,
    setAttachments,
    handleStepsChange,
    handleAttachmentsLoad,
    setValue,
    handleCancel,
    handleSubmitForm,
    addAttribute,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeChangeName,
    onAttributeRemove,
    handleAttachmentsChange,
    handleAttachmentsRemove,
    register,
    statuses,
    isDisabledSubmit,
    hasSteps,
    statusesOptions,
  } = useEditCloneResultModal({
    onCancel,
    testResult,
    isClone,
    onSubmit,
    onDirtyChange,
  })

  return (
    <>
      <div className={styles.header}>
        <Flex justify="space-between" style={{ marginBottom: 20 }}>
          <CloseIcon
            className={styles.closeIcon}
            onClick={handleCancel}
            data-testid={`close-${isClone ? "clone" : "edit"}-view-icon`}
          />
          <Flex gap={8}>
            <Button onClick={handleCancel} color="secondary">
              {t("Cancel")}
            </Button>
            <Button
              loading={isLoading}
              key="submit"
              color="accent"
              onClick={handleSubmitForm}
              disabled={isDisabledSubmit}
              data-testid={`close-${isClone ? "clone" : "edit"}-form-submit`}
            >
              {t("Submit")}
            </Button>
          </Flex>
        </Flex>
        <div className={styles.title} data-testid={`${isClone ? "clone" : "edit"}-view-title`}>
          <span style={{ marginRight: 4 }}>{isClone ? t("Clone Result") : t("Edit Result")}:</span>
          <span data-testid={`${isClone ? "clone" : "edit"}-view-test-case-name`}>
            {testCase.name}
          </span>
        </div>

        {errors ? (
          <AlertError error={errors as ErrorObj} skipFields={["status", "comment", "attributes"]} />
        ) : null}
      </div>

      <Form
        id="test-result-edit-form"
        layout="vertical"
        onFinish={handleSubmitForm}
        className={styles.formBody}
      >
        <Collapse
          ghost
          expandIcon={({ isActive }) => (
            <ArrowIcon
              width={24}
              height={24}
              data-testid="collapse-test-info-icon"
              className={classNames(styles.arrowIcon, {
                [styles.arrowIconOpen]: isActive,
              })}
            />
          )}
        >
          <Collapse.Panel
            header={
              <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 0 }}>
                {t("Test Info")}
              </Typography.Title>
            }
            key="1"
          >
            <div style={{ marginTop: 8 }}>
              <TestDetailInfo
                testCase={testCase}
                showScenario={false}
                canChangeAssign={false}
                id={isClone ? "clone-result" : "edit-result"}
              />
            </div>
          </Collapse.Panel>
        </Collapse>
        {hasSteps ? (
          <>
            <Form.Item
              label={t("Status")}
              validateStatus={errors?.status ? "error" : ""}
              help={errors?.status}
              required
              style={{ marginTop: 20 }}
            >
              <Controller
                name="status"
                control={control}
                render={({ field }) => {
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Select
                        {...field}
                        placeholder={t("Please select")}
                        style={{ width: "100%" }}
                        id={`${isClone ? "clone" : "edit"}-result-status`}
                      >
                        {statuses.map((status) => (
                          <Select.Option key={status.id} value={Number(status.id)}>
                            <Status
                              name={status.name}
                              color={status.color}
                              id={status.id}
                              extraId={`${isClone ? "clone" : "edit"}-result`}
                            />
                          </Select.Option>
                        ))}
                      </Select>
                      <ApplyToStepsButton
                        steps={testResult.steps_results}
                        status={field.value}
                        onApply={handleStepsChange}
                        id={`${isClone ? "clone" : "edit"}-result`}
                      />
                    </div>
                  )
                }}
              />
            </Form.Item>
            <Steps.StepList
              id={`${isClone ? "clone" : "edit"}-result-steps`}
              steps={testCase.steps}
              actions={{
                onChangeStatus: handleStepsChange,
              }}
              label={<div className={styles.stepsLabel}>{t("Steps")}</div>}
              project={testCase.project}
              stepStatuses={watchSteps}
              result={testResult}
            />
          </>
        ) : (
          <Form.Item
            style={{ marginTop: 24 }}
            label={<div className={styles.scenarioLabel}>{t("Scenario")}</div>}
          >
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Steps.ScenarioStep
                  scenario={testCase.scenario ?? ""}
                  expected={testCase.expected ?? ""}
                  statusesOptions={statusesOptions}
                  status={field.value}
                  onChangeStatus={field.onChange}
                />
              )}
            />
          </Form.Item>
        )}
        <Controller
          name="attributes"
          control={control}
          render={({ field }) => (
            <Row
              style={{
                flexDirection: "column",
                marginTop: testCase.steps.length ? 24 : 0,
                marginBottom: 24,
              }}
            >
              <CustomAttributeForm
                attributes={attributes}
                onChangeName={onAttributeChangeName}
                onChangeType={onAttributeChangeType}
                onChangeValue={onAttributeChangeValue}
                onRemove={onAttributeRemove}
                onBlur={field.onBlur}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                errors={errors?.attributes ? JSON.parse(errors?.attributes) : undefined}
              />
              <CustomAttributeAdd onClick={addAttribute} />
            </Row>
          )}
        />
        <Attachment.AddButton
          attachments={attachments}
          attachmentsIds={attachmentsIds}
          onChange={handleAttachmentsChange}
          onLoad={handleAttachmentsLoad}
          onRemove={handleAttachmentsRemove}
          register={register}
          id={`${isClone ? "clone" : "edit"}-result-attachments`}
        />
        <Form.Item
          label={t("Comment")}
          validateStatus={errors?.comment ? "error" : ""}
          help={errors?.comment ? errors.comment : ""}
          style={{ marginTop: 20 }}
        >
          <Controller
            name="comment"
            control={control}
            render={({ field }) => (
              <TextAreaWithAttach
                uploadId={`${isClone ? "clone" : "edit"}-result-comment`}
                textAreaId={`${isClone ? "clone" : "edit"}-result-comment-textarea`}
                fieldProps={field}
                stateAttachments={{ attachments, setAttachments }}
                customRequest={handleAttachmentsLoad}
                setValue={setValue}
              />
            )}
          />
        </Form.Item>
      </Form>
    </>
  )
}

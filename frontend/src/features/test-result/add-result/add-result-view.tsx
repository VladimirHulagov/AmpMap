import { CheckOutlined } from "@ant-design/icons"
import { Collapse, Flex, Form, Row, Select, Typography } from "antd"
import classNames from "classnames"
import { CustomAttributeAdd, CustomAttributeForm } from "entities/custom-attribute/ui"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TestDetailInfo } from "entities/test/ui"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import CloseIcon from "shared/assets/yi-icons/close.svg?react"
import { ErrorObj } from "shared/hooks"
import { AlertError, Attachment, Button, Status, Steps, TextAreaWithAttach } from "shared/ui"

import { ApplyToStepsButton } from "../apply-to-steps-button/apply-to-steps-button"
import styles from "./styles.module.css"
import { CreateResultModalProps, useAddResultView } from "./use-add-result-view"

export const AddResultView = (props: CreateResultModalProps) => {
  const { t } = useTranslation()
  const {
    isLoading,
    attachments,
    attachmentsIds,
    control,
    attributes,
    steps,
    errors,
    onLoad,
    onChange,
    onRemove,
    handleSubmitForm,
    handleCancel,
    setValue,
    register,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    setSteps,
    setAttachments,
    statuses,
    statusesOptions,
    disabled,
    hasSteps,
  } = useAddResultView(props)

  const { testCase } = props

  return (
    <>
      <div className={styles.header}>
        <Flex justify="space-between" style={{ marginBottom: 20 }}>
          <CloseIcon
            className={styles.closeIcon}
            onClick={handleCancel}
            data-testid="close-create-result-view-icon"
          />
          <Flex gap={8}>
            <Button
              data-testid="close-create-result-view-button"
              onClick={handleCancel}
              loading={isLoading}
              color="secondary"
            >
              {t("Cancel")}
            </Button>
            <Button
              data-testid="submit-create-result"
              loading={isLoading}
              icon={<CheckOutlined />}
              color="accent"
              onClick={handleSubmitForm}
              disabled={disabled}
            >
              {t("Submit")}
            </Button>
          </Flex>
        </Flex>
        <div className={styles.title} data-testid="add-view-title">
          <span style={{ marginRight: 4 }}>{t("Add Result")}:</span>
          <span data-testid="add-view-test-case-name">{testCase.name}</span>
        </div>
        {errors ? (
          <AlertError error={errors as ErrorObj} skipFields={["status", "comment", "attributes"]} />
        ) : null}
      </div>
      <Form
        id="create-result-form"
        layout="vertical"
        onFinish={handleSubmitForm}
        className={styles.formBody}
      >
        <Flex vertical>
          <Collapse
            ghost
            expandIcon={({ isActive }) => (
              <ArrowIcon
                data-testid="collapse-test-info-icon"
                className={classNames(styles.arrowIcon, {
                  [styles.arrowIconOpen]: isActive,
                })}
              />
            )}
          >
            <Collapse.Panel
              header={
                <Typography.Title level={4} className={styles.addResultTitle}>
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
                  id="add-result"
                />
              </div>
            </Collapse.Panel>
          </Collapse>
          {hasSteps ? (
            <>
              <Form.Item
                label={t("Status")}
                validateStatus={errors?.status ? "error" : ""}
                help={errors?.status ? errors.status : ""}
                required
                style={{ marginTop: 20 }}
              >
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <div className={styles.statusWrapper}>
                      <Select
                        {...field}
                        placeholder={t("Please select")}
                        style={{ width: "100%" }}
                        id="create-result-status"
                        popupClassName="create-result-status-select"
                      >
                        {statuses.map((status) => (
                          <Select.Option key={status.id} value={status.id}>
                            <Status
                              id={status.id}
                              name={status.name}
                              color={status.color}
                              extraId="create-result"
                            />
                          </Select.Option>
                        ))}
                      </Select>
                      <ApplyToStepsButton
                        steps={testCase.steps}
                        status={field.value}
                        onApply={setSteps}
                        id="create-result"
                      />
                    </div>
                  )}
                />
              </Form.Item>
              <Steps.StepList
                id="create-result"
                steps={testCase.steps}
                actions={{
                  onChangeStatus: setSteps,
                }}
                label={<div className={styles.stepsLabel}>{t("Steps")}</div>}
                project={testCase.project}
                stepStatuses={steps}
              />
            </>
          ) : (
            <Form.Item
              style={{ marginTop: 24 }}
              label={<div className={styles.scenarioLabel}>{t("Scenario")}</div>}
            >
              <Controller
                render={({ field }) => (
                  <Steps.ScenarioStep
                    scenario={testCase.scenario ?? ""}
                    expected={testCase.expected ?? ""}
                    statusesOptions={statusesOptions}
                    status={field.value}
                    onChangeStatus={field.onChange}
                  />
                )}
                name="status"
                control={control}
              />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: attachments.length ? 24 : 10 }}>
            <Controller
              name="attributes"
              control={control}
              render={({ field }) => (
                <Row style={{ flexDirection: "column", marginTop: testCase.steps.length ? 24 : 0 }}>
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
          </Form.Item>
          <Attachment.AddButton
            attachments={attachments}
            attachmentsIds={attachmentsIds}
            onChange={onChange}
            onLoad={onLoad}
            onRemove={onRemove}
            register={register}
            id="create-result-attachments"
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
                  uploadId="create-result-comment"
                  textAreaId="create-result-comment-textarea"
                  fieldProps={field}
                  stateAttachments={{ attachments, setAttachments }}
                  customRequest={onLoad}
                  setValue={setValue}
                />
              )}
            />
          </Form.Item>
        </Flex>
      </Form>
    </>
  )
}

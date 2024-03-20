import { InfoCircleOutlined } from "@ant-design/icons"
import { Button, Col, Dropdown, Form, Input, MenuProps, Modal, Row, Tooltip, Upload } from "antd"
import { Controller } from "react-hook-form"

import { LabelWrapper } from "entities/label/ui"

import { TestCaseStepsWrapper } from "entities/test-case/ui/steps/wrapper"

import { config } from "shared/config"
import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError, Attachment, TextAreaWithAttach } from "shared/ui"

import { SelectSuiteTestCase } from "../select-suite-test-case/select-suite-test-case"
import { useTestCaseEditModal } from "./use-test-case-edit-modal"

const { Dragger } = Upload

interface Props {
  testCase: TestCase
}

export const EditTestCaseModal = ({ testCase }: Props) => {
  const {
    title,
    isShow,
    isEditMode,
    isLoading,
    errors,
    formErrors,
    control,
    attachments,
    attachmentsIds,
    steps,
    isSteps,
    isDirty,
    labelProps,
    setIsSteps,
    setSteps,
    onLoad,
    onRemove,
    onChange,
    setValue,
    clearErrors,
    setAttachments,
    handleCancel,
    handleSubmitFormAsCurrent,
    handleSubmitFormAsNew,
    register,
    treeSuites,
    shouldShowSuiteSelect,
    flatSuites,
  } = useTestCaseEditModal({ testCase })

  const scenarioFormErrors = !isSteps
    ? formErrors.scenario?.message ?? errors?.scenario ?? ""
    : !steps.length
      ? "Обязательное поле."
      : ""

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <Button
          id="modal-update-test-case-btn"
          key="submit"
          loading={isLoading}
          onClick={handleSubmitFormAsCurrent}
          type="primary"
          disabled={!isDirty}
        >
          Update current version
        </Button>
      ),
    },
  ]

  return (
    <Modal
      className="edit-test-case-modal"
      title={title}
      open={isShow && isEditMode}
      onCancel={handleCancel}
      width="1100px"
      footer={[
        <Button id="modal-edit-close-btn" key="back" onClick={handleCancel}>
          Close
        </Button>,
        <Dropdown.Button
          key="update"
          className="edit-test-case"
          menu={{ items }}
          type={isDirty ? "primary" : undefined}
          loading={isLoading}
          disabled={!isDirty}
          style={{ width: "fit-content", display: "inline-flex", marginLeft: 8 }}
          onClick={handleSubmitFormAsNew}
        >
          Update
        </Dropdown.Button>,
      ]}
    >
      <>
        {errors ? (
          <AlertError
            error={errors as ErrorObj}
            skipFields={["name", "setup", "scenario", "teardown", "estimate", "steps"]}
          />
        ) : null}

        <Form id="edit-test-case-form" layout="vertical" onFinish={handleSubmitFormAsNew}>
          <Row gutter={[32, 32]}>
            <Col span={12}>
              <Form.Item
                label="Name"
                validateStatus={formErrors.name?.message ?? errors?.name ? "error" : ""}
                help={formErrors.name?.message ?? errors?.name ?? ""}
                required
              >
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input {...field} id="edit-name-input" />}
                />
              </Form.Item>
              {shouldShowSuiteSelect && (
                <Form.Item
                  label="Suite"
                  validateStatus={errors?.suite ? "error" : ""}
                  help={errors?.suite ? errors.suite : ""}
                >
                  <Controller
                    name="suite"
                    control={control}
                    render={({ field }) => {
                      const suiteName =
                        flatSuites.find((item) => item.id === field.value)?.name ?? ""

                      return (
                        <SelectSuiteTestCase
                          suiteName={suiteName}
                          selectedSuiteId={field.value}
                          onChange={field.onChange}
                          treeSuites={treeSuites?.results ?? []}
                        />
                      )
                    }}
                  />
                </Form.Item>
              )}

              <Form.Item
                label="Setup"
                validateStatus={errors?.setup ? "error" : ""}
                help={errors?.setup ? errors.setup : ""}
              >
                <Controller
                  name="setup"
                  control={control}
                  render={({ field }) => (
                    <TextAreaWithAttach
                      uploadId="edit-setup"
                      textAreaId="edit-setup-textarea"
                      fieldProps={field}
                      stateAttachments={{ attachments, setAttachments }}
                      customRequest={onLoad}
                      setValue={setValue}
                    />
                  )}
                />
              </Form.Item>
              <Form.Item
                label="Scenario"
                validateStatus={scenarioFormErrors ? "error" : ""}
                help={scenarioFormErrors}
                required
              >
                <Controller
                  name="scenario"
                  control={control}
                  render={({ field }) => (
                    <TestCaseStepsWrapper
                      fieldProps={field}
                      stateAttachments={{ attachments, setAttachments }}
                      stateSteps={{ steps, setSteps }}
                      customRequest={onLoad}
                      setValue={setValue}
                      clearErrors={clearErrors}
                      control={control}
                      isSteps={isSteps}
                      setIsSteps={setIsSteps}
                      isEditMode={isEditMode}
                    />
                  )}
                />
              </Form.Item>
              {!isSteps && (
                <Form.Item
                  label="Expected"
                  validateStatus={errors?.expected ? "error" : ""}
                  help={errors?.expected ? errors.expected : ""}
                >
                  <Controller
                    name="expected"
                    control={control}
                    render={({ field }) => (
                      <TextAreaWithAttach
                        uploadId="edit-expected"
                        textAreaId="edit-expected-textarea"
                        fieldProps={field}
                        stateAttachments={{ attachments, setAttachments }}
                        customRequest={onLoad}
                        setValue={setValue}
                      />
                    )}
                  />
                </Form.Item>
              )}
            </Col>
            <Col span={12}>
              <Form.Item
                label="Estimate"
                validateStatus={errors?.estimate ? "error" : ""}
                help={errors?.estimate ? errors.estimate : ""}
              >
                <Controller
                  name="estimate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="edit-estimate-input"
                      value={field.value ?? ""}
                      suffix={
                        <Tooltip overlayStyle={{ minWidth: 460 }} title={config.estimateTooltip}>
                          <InfoCircleOutlined style={{ color: "rgba(0,0,0,.45)" }} />
                        </Tooltip>
                      }
                    />
                  )}
                />
              </Form.Item>
              <Form.Item
                label="Teardown"
                validateStatus={errors?.teardown ? "error" : ""}
                help={errors?.teardown ? errors.teardown : ""}
              >
                <Controller
                  name="teardown"
                  control={control}
                  render={({ field }) => (
                    <TextAreaWithAttach
                      uploadId="edit-teardown"
                      textAreaId="edit-teardown-textarea"
                      fieldProps={field}
                      stateAttachments={{ attachments, setAttachments }}
                      customRequest={onLoad}
                      setValue={setValue}
                    />
                  )}
                />
              </Form.Item>
              <Form.Item
                label="Description"
                validateStatus={errors?.description ? "error" : ""}
                help={errors?.description ? errors.description : ""}
              >
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextAreaWithAttach
                      uploadId="edit-description"
                      textAreaId="edit-description-textarea"
                      fieldProps={field}
                      stateAttachments={{ attachments, setAttachments }}
                      customRequest={onLoad}
                      setValue={setValue}
                    />
                  )}
                />
              </Form.Item>
              <Form.Item
                label="Labels"
                validateStatus={errors?.labels ? "error" : ""}
                help={errors?.labels ? errors.labels : ""}
              >
                <Controller
                  name="labels"
                  control={control}
                  render={({ field }) => (
                    <LabelWrapper labelProps={labelProps} fieldProps={field} />
                  )}
                />
              </Form.Item>
              <Attachment.List handleAttachmentRemove={onRemove} attachments={attachments} />
              {attachmentsIds.map((field, index) => (
                <input type="hidden" key={field.id} {...register(`attachments.${index}`)} />
              ))}
              <Dragger
                name="file"
                multiple
                showUploadList={false}
                customRequest={onLoad}
                onChange={onChange}
                fileList={attachments}
                height={80}
              >
                <p className="ant-upload-text">Drop files here to attach, or click to browse.</p>
              </Dragger>
            </Col>
          </Row>
        </Form>
      </>
    </Modal>
  )
}

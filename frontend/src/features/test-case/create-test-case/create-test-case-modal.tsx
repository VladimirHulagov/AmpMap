import { InfoCircleOutlined } from "@ant-design/icons"
import { Button, Col, Form, Input, Modal, Row, Tooltip, Upload } from "antd"
import { Controller } from "react-hook-form"

import { LabelWrapper } from "entities/label/ui"

import { TestCaseStepsWrapper } from "entities/test-case/ui/steps/wrapper"

import { config } from "shared/config"
import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError, Attachment, TextAreaWithAttach } from "shared/ui"

import { useTestCaseCreateModal } from "./use-test-case-create-modal"

const { Dragger } = Upload

export const CreateTestCaseModal = () => {
  const {
    isEditMode,
    isShow,
    isLoading,
    errors,
    formErrors,
    control,
    attachments,
    attachmentsIds,
    steps,
    isSteps,
    isDirty,
    setIsSteps,
    setSteps,
    onLoad,
    onRemove,
    onChange,
    setValue,
    clearErrors,
    setAttachments,
    handleCancel,
    handleSubmitForm,
    register,
    labelProps,
  } = useTestCaseCreateModal()

  const scenarioFormErrors = !isSteps
    ? formErrors.scenario?.message ?? errors?.scenario ?? ""
    : !steps.length
      ? "Обязательное поле."
      : ""

  return (
    <Modal
      className="create-test-case-modal"
      title="Create Test Case"
      open={isShow && !isEditMode}
      onCancel={handleCancel}
      width="1100px"
      footer={[
        <Button id="modal-create-close-btn" key="back" onClick={handleCancel}>
          Close
        </Button>,
        <Button
          id="modal-create-test-case-btn"
          key="submit"
          loading={isLoading}
          onClick={handleSubmitForm}
          type="primary"
          htmlType="submit"
          disabled={!isDirty}
        >
          Create
        </Button>,
      ]}
    >
      <>
        {errors ? (
          <AlertError
            error={errors as ErrorObj}
            skipFields={["name", "setup", "scenario", "teardown", "estimate"]}
          />
        ) : null}

        <Form id="create-test-case-form" layout="vertical" onFinish={handleSubmitForm}>
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
                  rules={{ required: "Обязательное поле." }}
                  render={({ field }) => <Input {...field} id="create-name-input" />}
                />
              </Form.Item>
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
                      uploadId="create-setup"
                      textAreaId="create-setup-textarea"
                      fieldProps={field}
                      stateAttachments={{ attachments, setAttachments }}
                      customRequest={onLoad}
                      setValue={setValue}
                    />
                  )}
                />
              </Form.Item>
              {/* // TODO Нужно разделить эту часть на два отдельных контроллера
              // чтобы контролировать ошибки по полю scenario и steps отдельно */}
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
                        uploadId="create-expected"
                        textAreaId="create-expected-textarea"
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
                      id="create-estimate-input"
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
                      uploadId="create-teardown"
                      textAreaId="create-teardown-textarea"
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
                      uploadId="create-description"
                      textAreaId="create-description-textarea"
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

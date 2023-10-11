import { InfoCircleOutlined } from "@ant-design/icons"
import { Button, Col, Form, Input, Modal, Row, Tooltip, Upload } from "antd"
import { Controller } from "react-hook-form"

import { LabelWrapper } from "entities/label/ui"

import { AlertError, Attachment, TextArea } from "shared/ui"

import { TestCaseStepsWrapper } from "../../../entities/test-case/ui/steps/wrapper"
import { useTestCaseCreateModal } from "./use-test-case-create-modal"

const { Dragger } = Upload

export const CreateTestCaseModal = () => {
  const {
    isEditMode,
    isShow,
    isLoading,
    errors,
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
    setAttachments,
    handleCancel,
    handleSubmitForm,
    register,
    labelProps,
  } = useTestCaseCreateModal()

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
          disabled={!isDirty}
        >
          Create
        </Button>,
      ]}
    >
      <>
        {errors ? (
          <AlertError
            error={errors}
            skipFields={["name", "setup", "scenario", "teardown", "estimate"]}
          />
        ) : null}

        <Form id="create-test-case-form" layout="vertical" onFinish={handleSubmitForm}>
          <Row gutter={[32, 32]}>
            <Col span={12}>
              <Form.Item
                label="Name"
                validateStatus={errors?.name ? "error" : ""}
                help={errors?.name ? errors.name : ""}
              >
                <Controller
                  name="name"
                  control={control}
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
                    <TextArea
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
              <Form.Item
                label="Scenario"
                validateStatus={errors?.scenario ? "error" : ""}
                help={errors?.scenario ? errors.scenario : ""}
                required={false}
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
                      <TextArea
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
                      value={field.value || ""}
                      suffix={
                        <Tooltip
                          overlayStyle={{ minWidth: 460 }}
                          title="Example formats: 120, 1w 1d 1h 1m 1s, 2 days, 4:13:02 (uptime format), 4:13:02.266, 5hr34m56s, 5 hours, 34 minutes, 56 seconds"
                        >
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
                    <TextArea
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
                    <TextArea
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

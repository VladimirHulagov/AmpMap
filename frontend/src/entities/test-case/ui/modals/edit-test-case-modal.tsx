import { InfoCircleOutlined } from "@ant-design/icons"
import { Button, Col, Form, Input, Modal, Row, Tooltip, Upload } from "antd"
import { Controller } from "react-hook-form"

import { LabelWrapper } from "entities/label/ui"

import { useTestCaseEditModal } from "entities/test-case/model"

import { AlertError, Attachment, TextArea } from "shared/ui"

import { TestCaseStepsWrapper } from "../steps/wrapper"
import { SelectSuiteModal } from "./select-suite-modal"

const { Dragger } = Upload

interface Props {
  testCase: ITestCase
}

export const EditTestCaseModal = ({ testCase }: Props) => {
  const {
    title,
    isShow,
    isEditMode,
    isLoading,
    errors,
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
    setAttachments,
    handleCancel,
    handleSubmitForm,
    register,
    treeSuites,
    shouldShowSuiteSelect,
    flatSuites,
    isSelectSuiteModalOpened,
    setIsSelectSuiteModalOpened,
  } = useTestCaseEditModal({ testCase })

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
        <Button
          id="modal-update-test-case-btn"
          key="submit"
          loading={isLoading}
          onClick={handleSubmitForm}
          type="primary"
          disabled={!isDirty}
        >
          Update
        </Button>,
      ]}
    >
      <>
        {errors ? (
          <AlertError
            error={errors}
            skipFields={["name", "setup", "scenario", "teardown", "estimate", "steps"]}
          />
        ) : null}

        <Form id="edit-test-case-form" layout="vertical" onFinish={handleSubmitForm}>
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
                        flatSuites.find((item) => item.id === field.value)?.name || ""
                      return (
                        <>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <Input
                              id="suite-edit-input"
                              value={suiteName}
                              readOnly
                              style={{ width: "100%" }}
                            />
                            <Button
                              id="suite-edit-btn"
                              type="primary"
                              style={{ width: 80, marginLeft: 10 }}
                              onClick={() => setIsSelectSuiteModalOpened(true)}
                            >
                              Edit
                            </Button>
                          </div>
                          <SelectSuiteModal
                            opened={isSelectSuiteModalOpened}
                            onCancel={() => setIsSelectSuiteModalOpened(false)}
                            onSubmit={(value: number) => {
                              field.onChange(value)
                              setIsSelectSuiteModalOpened(false)
                            }}
                            treeSuites={treeSuites || []}
                            selectedSuiteId={field.value}
                          />
                        </>
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
                    <TextArea
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
                validateStatus={errors?.scenario || errors?.steps ? "error" : ""}
                help={errors?.scenario || errors?.steps || ""}
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
                    <TextArea
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

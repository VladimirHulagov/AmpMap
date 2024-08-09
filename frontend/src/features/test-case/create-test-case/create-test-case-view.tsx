import { InfoCircleOutlined, PlusOutlined } from "@ant-design/icons"
import { Button, Col, Form, Input, Row, Space, Tabs, Tooltip, Typography, Upload } from "antd"
import { Controller } from "react-hook-form"

import { LabelWrapper } from "entities/label/ui"

import { TestCaseStepsWrapper } from "entities/test-case/ui/steps/wrapper"

import { config } from "shared/config"
import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError, Attachment, Attribute, TextAreaWithAttach } from "shared/ui"

import { useTestCaseCreateView } from "./use-test-case-create-view"

const { Dragger } = Upload

export const CreateTestCaseView = () => {
  const {
    isLoading,
    errors,
    formErrors,
    control,
    attachments,
    attachmentsIds,
    steps,
    isSteps,
    isDirty,
    tab,
    attributes,
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
    handleTabChange,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
  } = useTestCaseCreateView()

  const scenarioFormErrors = !isSteps
    ? formErrors.scenario?.message ?? errors?.scenario ?? ""
    : !steps.length
      ? "Обязательное поле."
      : ""

  return (
    <div
      className="create-test-case-modal site-layout-background"
      style={{ padding: 24, minHeight: 360 }}
    >
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Create Test Case
      </Typography.Title>
      {errors ? (
        <AlertError
          error={errors as ErrorObj}
          skipFields={["name", "setup", "scenario", "teardown", "estimate", "attributes"]}
        />
      ) : null}

      <Form id="create-test-case-form" layout="vertical" onFinish={handleSubmitForm}>
        <Tabs defaultActiveKey="general" onChange={handleTabChange} activeKey={tab}>
          <Tabs.TabPane tab="General" key="general">
            <Row gutter={[32, 32]} style={{ marginTop: 14 }}>
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
                        isEditMode={false}
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
                <Controller
                  name="attributes"
                  control={control}
                  render={({ field }) => (
                    <Row style={{ flexDirection: "column", marginTop: steps.length ? 24 : 0 }}>
                      <div className="ant-col ant-form-item-label">
                        <label title="Attributes">Attributes</label>
                      </div>
                      <Attribute.List
                        fieldProps={field}
                        attributes={attributes}
                        handleAttributeRemove={onAttributeRemove}
                        handleAttributeChangeName={onAttributeChangeName}
                        handleAttributeChangeValue={onAttributeChangeValue}
                        handleAttributeChangeType={onAttributeChangeType}
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        errors={errors?.attributes ? JSON.parse(errors?.attributes) : undefined}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Button id="add-attribute-btn" type="dashed" block onClick={addAttribute}>
                          <PlusOutlined /> Add attribute
                        </Button>
                      </div>
                    </Row>
                  )}
                />
              </Col>
            </Row>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Attachments" key="attachments">
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
          </Tabs.TabPane>
        </Tabs>
        <Row style={{ justifyContent: "right", marginTop: "16px" }}>
          <Space>
            <Button id="modal-create-close-btn" key="back" onClick={handleCancel}>
              Close
            </Button>
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
            </Button>
          </Space>
        </Row>
      </Form>
    </div>
  )
}

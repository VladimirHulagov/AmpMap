import { PlusOutlined } from "@ant-design/icons"
import { Button, Col, Dropdown, Form, Input, MenuProps, Row, Tabs, Typography, Upload } from "antd"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { LabelWrapper } from "entities/label/ui"

import { TestCaseStepsBlock } from "entities/test-case/ui/steps/block"

import { config } from "shared/config"
import { ErrorObj } from "shared/hooks"
import {
  AlertError,
  Attachment,
  Attribute,
  ContainerLoader,
  InfoTooltipBtn,
  TextAreaWithAttach,
} from "shared/ui"

import { LayoutView } from "widgets/[ui]"

import { ScenarioLabelFormTestCase } from "../create-test-case/scenario-label-form-test-case"
import { SelectSuiteTestCase } from "../select-suite-test-case/select-suite-test-case"
import styles from "./styles.module.css"
import { useTestCaseEditView } from "./use-test-case-edit-view"

const { Dragger } = Upload

export const EditTestCaseView = () => {
  const { t } = useTranslation()
  const {
    title,
    isLoading,
    errors,
    formErrors,
    control,
    attachments,
    attachmentsIds,
    isSteps,
    steps,
    isDirty,
    labelProps,
    tab,
    shouldShowSuiteSelect,
    attributes,
    selectedSuite,
    onLoad,
    onRemove,
    onChange,
    setValue,
    setAttachments,
    handleCancel,
    handleSubmitFormAsCurrent,
    handleSubmitFormAsNew,
    register,
    handleTabChange,
    addAttribute,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeChangeName,
    onAttributeRemove,
    handleSelectSuite,
  } = useTestCaseEditView()

  const scenarioFormErrors = !isSteps
    ? (formErrors.scenario?.message ?? errors?.scenario ?? "")
    : !steps.length
      ? t("Required field")
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
          {t("Update current version")}
        </Button>
      ),
    },
  ]

  if (isLoading) {
    return <ContainerLoader />
  }

  return (
    <LayoutView className="edit-test-case-modal" style={{ minHeight: 360 }}>
      <Typography.Title level={2} style={{ marginTop: 0 }}>
        {title}
      </Typography.Title>
      {errors ? (
        <AlertError
          error={errors as ErrorObj}
          skipFields={["name", "setup", "scenario", "teardown", "estimate", "steps", "attributes"]}
        />
      ) : null}

      <Form id="edit-test-case-form" layout="vertical" onFinish={handleSubmitFormAsNew}>
        <Tabs defaultActiveKey="general" onChange={handleTabChange} activeKey={tab}>
          <Tabs.TabPane tab={t("General")} key="general">
            <Row gutter={[32, 32]} style={{ marginTop: 14 }}>
              <Col span={12}>
                <Form.Item
                  label={t("Name")}
                  validateStatus={(formErrors.name?.message ?? errors?.name) ? "error" : ""}
                  help={formErrors.name?.message ?? errors?.name ?? ""}
                  required
                >
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => <Input {...field} id="edit-name-input" />}
                  />
                </Form.Item>
                <Form.Item
                  label={t("Description")}
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
                {shouldShowSuiteSelect && (
                  <Form.Item
                    label={t("Suite")}
                    validateStatus={errors?.suite ? "error" : ""}
                    help={errors?.suite ? errors.suite : ""}
                  >
                    <Controller
                      name="suite"
                      control={control}
                      render={() => (
                        <SelectSuiteTestCase suite={selectedSuite} onChange={handleSelectSuite} />
                      )}
                    />
                  </Form.Item>
                )}
                <Form.Item
                  label={t("Setup")}
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
                {!isSteps && (
                  <Form.Item
                    label={<ScenarioLabelFormTestCase control={control} />}
                    validateStatus={scenarioFormErrors ? "error" : ""}
                    help={scenarioFormErrors}
                    required
                    className={styles.formItem}
                  >
                    <Controller
                      name="scenario"
                      control={control}
                      render={({ field }) => (
                        <TextAreaWithAttach
                          uploadId="edit-scenario"
                          textAreaId="edit-scenario-textarea"
                          customRequest={onLoad}
                          fieldProps={field}
                          stateAttachments={{ attachments, setAttachments }}
                          setValue={setValue}
                        />
                      )}
                    />
                  </Form.Item>
                )}
                {isSteps && (
                  <Form.Item
                    label={<ScenarioLabelFormTestCase control={control} />}
                    validateStatus={scenarioFormErrors ? "error" : ""}
                    help={scenarioFormErrors}
                    required
                    className={styles.formItem}
                  >
                    <Controller
                      name="steps"
                      control={control}
                      render={({ field }) => (
                        <TestCaseStepsBlock steps={field.value ?? []} setSteps={field.onChange} />
                      )}
                    />
                  </Form.Item>
                )}
                {!isSteps && (
                  <Form.Item
                    label={t("Expected")}
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
                <Form.Item
                  label={t("Teardown")}
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
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t("Estimate")}
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
                        suffix={<InfoTooltipBtn title={config.estimateTooltip} />}
                      />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  label={t("Labels")}
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
                    <Row style={{ flexDirection: "column", marginTop: 0 }}>
                      <div className="ant-col ant-form-item-label">
                        <label title="Attributes">{t("Attributes")}</label>
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
                        <Button type="dashed" block onClick={addAttribute}>
                          <PlusOutlined /> {t("Add attribute")}
                        </Button>
                      </div>
                    </Row>
                  )}
                />
              </Col>
            </Row>
          </Tabs.TabPane>
          <Tabs.TabPane tab={t("Attachments")} key="attachments">
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
              <p className="ant-upload-text">
                {t("Drop files here to attach, or click to browse")}
              </p>
            </Dragger>
          </Tabs.TabPane>
        </Tabs>
        <Row style={{ justifyContent: "right", marginTop: "16px" }}>
          <Button id="modal-edit-close-btn" key="back" onClick={handleCancel}>
            {t("Close")}
          </Button>
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
            {t("Update")}
          </Dropdown.Button>
        </Row>
      </Form>
    </LayoutView>
  )
}

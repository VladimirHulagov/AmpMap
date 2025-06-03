import { Flex, Form, Input, Row, Tabs } from "antd"
import { CustomAttributeAdd, CustomAttributeForm } from "entities/custom-attribute/ui"
import { TreebarContext } from "processes"
import { useContext, useRef } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FooterView } from "widgets"

import { LabelWrapper } from "entities/label/ui"

import { config } from "shared/config"
import { ErrorObj, useResizebleBlock } from "shared/hooks"
import stylesViewForm from "shared/styles/view-form.module.css"
import {
  AlertError,
  Attachment,
  FormViewHeader,
  InfoTooltipBtn,
  LineDivider,
  TextAreaWithAttach,
} from "shared/ui"

import { ScenarioFormItem } from "../form-items/scenario-form-item"
import { StepsFormItem } from "../form-items/steps-form-item"
import { SelectSuiteTestCase } from "../select-suite-test-case/select-suite-test-case"
import { useTestCaseCreateView } from "./use-test-case-create-view"

export const CreateTestCaseView = () => {
  const { t } = useTranslation()
  const {
    createForm,
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
    labelProps,
    selectedSuite,
    onLoad,
    onRemove,
    onChange,
    setValue,
    setAttachments,
    handleCancel,
    handleSubmitForm,
    register,
    handleTabChange,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    handleSelectSuite,
  } = useTestCaseCreateView()

  const scenarioFormErrors = !isSteps
    ? (formErrors.scenario?.message ?? errors?.scenario ?? "")
    : !steps.length
      ? t("Required field")
      : ""

  const elRef = useRef(null)
  const containerRef = useRef(null)

  const { treebarWidth } = useContext(TreebarContext)!
  const { width, handleMouseDown, focus } = useResizebleBlock({
    key: "create-test-case",
    elRef,
    containerRef,
    defaultWidth: 600,
    minWidth: 400,
    maxWidth: 50,
    maxAsPercent: true,
    direction: "right",
  })

  return (
    <>
      <FormProvider {...createForm}>
        <FormViewHeader
          model="test-case"
          type="create"
          isDisabledSubmit={!isDirty}
          isLoadingSubmit={isLoading}
          onSubmit={handleSubmitForm}
          onClose={handleCancel}
          title={
            <>
              {t("Create")} {t("Test")} {t("Case")}
            </>
          }
        />

        {errors ? (
          <AlertError
            error={errors as ErrorObj}
            skipFields={["name", "setup", "scenario", "teardown", "estimate", "attributes"]}
          />
        ) : null}

        <Form
          id="create-test-case-form"
          layout="vertical"
          onFinish={handleSubmitForm}
          className={stylesViewForm.form}
        >
          <Tabs defaultActiveKey="general" onChange={handleTabChange} activeKey={tab}>
            <Tabs.TabPane tab={t("General")} key="general" className={stylesViewForm.tabPane}>
              <Flex vertical className={stylesViewForm.formWrapper}>
                <Flex
                  className={stylesViewForm.formContainer}
                  ref={containerRef}
                  style={{ maxWidth: `calc(100vw - 80px - ${treebarWidth}px)` }}
                >
                  <Flex vertical style={{ width }} ref={elRef}>
                    <Form.Item
                      label={t("Name")}
                      validateStatus={(formErrors.name?.message ?? errors?.name) ? "error" : ""}
                      help={formErrors.name?.message ?? errors?.name ?? ""}
                      required
                    >
                      <Controller
                        name="name"
                        control={control}
                        rules={{ required: t("Required field") }}
                        render={({ field }) => <Input {...field} id="create-name-input" />}
                      />
                    </Form.Item>
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
                    {!isSteps ? (
                      <ScenarioFormItem
                        type="create"
                        isSteps={isSteps}
                        scenarioFormErrors={scenarioFormErrors}
                        onLoad={onLoad}
                        setAttachments={setAttachments}
                        attachments={attachments}
                      />
                    ) : (
                      <StepsFormItem
                        type="create"
                        isSteps={isSteps}
                        scenarioFormErrors={scenarioFormErrors}
                      />
                    )}
                    {!isSteps && (
                      <Form.Item
                        label={t("Expected")}
                        validateStatus={
                          (formErrors.expected?.message ?? errors?.expected) ? "error" : ""
                        }
                        help={formErrors.expected?.message ?? errors?.expected ?? ""}
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
                      label={t("Teardown")}
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
                    <Controller
                      name="attributes"
                      control={control}
                      render={({ field }) => (
                        <Row style={{ flexDirection: "column", marginTop: 0 }}>
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
                  </Flex>
                  <LineDivider onMouseDown={handleMouseDown} focus={focus} />
                  <Flex vertical style={{ flex: "1 1" }}>
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
                            id="create-estimate-input"
                            data-testid="create-estimate-input"
                            value={field.value ?? ""}
                            suffix={<InfoTooltipBtn title={config.estimateTooltip} />}
                          />
                        )}
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
                    <Form.Item
                      label={t("Suite")}
                      validateStatus={(formErrors.suite?.message ?? errors?.suite) ? "error" : ""}
                      help={formErrors.suite?.message ?? errors?.suite ?? ""}
                      required
                    >
                      <Controller
                        name="suite"
                        control={control}
                        render={() => (
                          <SelectSuiteTestCase suite={selectedSuite} onChange={handleSelectSuite} />
                        )}
                      />
                    </Form.Item>
                  </Flex>
                </Flex>
                <FooterView />
              </Flex>
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={t("Attachments")}
              key="attachments"
              className={stylesViewForm.tabPane}
            >
              <Flex vertical className={stylesViewForm.formWrapper}>
                <Attachment.DropFiles
                  attachments={attachments}
                  attachmentsIds={attachmentsIds}
                  onChange={onChange}
                  onLoad={onLoad}
                  onRemove={onRemove}
                  register={register}
                  id="create-test-case-attachments"
                  className={stylesViewForm.attachmentsContainer}
                />
                <FooterView />
              </Flex>
            </Tabs.TabPane>
          </Tabs>
        </Form>
      </FormProvider>
    </>
  )
}

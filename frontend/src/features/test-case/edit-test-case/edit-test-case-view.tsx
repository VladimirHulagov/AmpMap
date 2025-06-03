import { Flex, Form, Input, MenuProps, Row, Tabs } from "antd"
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
  Button,
  ContainerLoader,
  DropdownButton,
  FormViewHeader,
  InfoTooltipBtn,
  LineDivider,
  TextAreaWithAttach,
} from "shared/ui"

import { ScenarioFormItem } from "../form-items/scenario-form-item"
import { StepsFormItem } from "../form-items/steps-form-item"
import { SelectSuiteTestCase } from "../select-suite-test-case/select-suite-test-case"
import { useTestCaseEditView } from "./use-test-case-edit-view"

export const EditTestCaseView = () => {
  const { t } = useTranslation()
  const {
    editForm,
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

  const elRef = useRef(null)
  const containerRef = useRef(null)

  const { treebarWidth } = useContext(TreebarContext)!
  const { width, handleMouseDown, focus } = useResizebleBlock({
    key: "edit-test-case",
    elRef,
    containerRef,
    defaultWidth: 600,
    minWidth: 400,
    maxWidth: 50,
    maxAsPercent: true,
    direction: "right",
  })

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <Button
          id="modal-update-test-case-btn"
          key="submit"
          loading={isLoading}
          onClick={handleSubmitFormAsCurrent}
          color="accent"
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
    <>
      <FormProvider {...editForm}>
        <FormViewHeader
          model="test-case"
          type="edit"
          title={title}
          onClose={handleCancel}
          submitNode={
            <DropdownButton
              key="update"
              className="edit-test-case"
              menu={{ items }}
              color={isDirty ? "accent" : "secondary-linear"}
              loading={isLoading}
              disabled={!isDirty}
              style={{ width: "fit-content", display: "inline-flex" }}
              onClick={handleSubmitFormAsNew}
              size="l"
              data-testid="dropdown-update-button"
            >
              {t("Update")}
            </DropdownButton>
          }
        />

        {errors ? (
          <AlertError
            error={errors as ErrorObj}
            skipFields={["name", "setup", "scenario", "teardown", "estimate", "attributes"]}
            style={{ marginInline: 24, marginTop: 24 }}
          />
        ) : null}

        <Form
          id="edit-test-case-form"
          layout="vertical"
          onFinish={handleSubmitFormAsNew}
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
                        render={({ field }) => <Input {...field} id="edit-name-input" />}
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
                    {!isSteps ? (
                      <ScenarioFormItem
                        type="edit"
                        isSteps={isSteps}
                        scenarioFormErrors={scenarioFormErrors}
                        onLoad={onLoad}
                        setAttachments={setAttachments}
                        attachments={attachments}
                      />
                    ) : (
                      <StepsFormItem
                        type="edit"
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
                            id="edit-estimate-input"
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
                            <SelectSuiteTestCase
                              suite={selectedSuite}
                              onChange={handleSelectSuite}
                            />
                          )}
                        />
                      </Form.Item>
                    )}
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
                  id="edit-test-case-attachments"
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

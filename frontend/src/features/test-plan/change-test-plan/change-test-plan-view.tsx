import { Flex, Form, Row, Tabs } from "antd"
import dayjs from "dayjs"
import { CustomAttributeAdd, CustomAttributeForm } from "entities/custom-attribute/ui"
import { TreebarContext } from "processes"
import { useContext, useRef } from "react"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FooterView } from "widgets"

import { useLazyGetTestPlanAncestorsQuery, useLazyGetTestPlansQuery } from "entities/test-plan/api"

import { ErrorObj, useResizebleBlock } from "shared/hooks"
import stylesViewForm from "shared/styles/view-form.module.css"
import {
  AlertError,
  Attachment,
  FormViewHeader,
  InputFormItem,
  LineDivider,
  TextAreaWithAttach,
} from "shared/ui"
import { DateFormItem, LazyTreeSearchFormItem, TreeSelectFormItem } from "shared/ui/form-items"

import styles from "./styles.module.css"
import { TestCasesFormItem } from "./ui"
import { useChangeTestPlan } from "./use-change-test-plan"

interface Props {
  type: "create" | "edit"
}

export const ChangeTestPlanView = ({ type }: Props) => {
  const { t } = useTranslation()
  const {
    control,
    formErrors,
    errors,
    tab,
    isDirty,
    isLoadingSubmit,
    selectedParent,
    attachments,
    attachmentsIds,
    parametersTreeView,
    stateTestPlan,
    handleTabChange,
    handleCancel,
    handleSubmitForm,
    setDateFrom,
    setDateTo,
    disabledDateTo,
    handleSelectTestPlan,
    setAttachments,
    handleAttachmentChange,
    handleAttachmentLoad,
    handleAttachmentRemove,
    setValue,
    register,
    attributes,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
  } = useChangeTestPlan({ type })

  const [getPlans] = useLazyGetTestPlansQuery()
  const [getAncestors] = useLazyGetTestPlanAncestorsQuery()
  const elRef = useRef(null)
  const containerRef = useRef(null)

  const { treebarWidth } = useContext(TreebarContext)!
  const { width, handleMouseDown, focus } = useResizebleBlock({
    key: `${type}-test-plan`,
    elRef,
    containerRef,
    defaultWidth: 600,
    minWidth: 400,
    maxWidth: 50,
    maxAsPercent: true,
    direction: "right",
  })

  const formTitle =
    type === "create"
      ? `${t("Create")} ${t("Test Plan")}`
      : `${t("Edit")} ${t("Test Plan")} '${stateTestPlan?.name}'`

  return (
    <>
      <FormViewHeader
        model="test-plan"
        type={type}
        title={formTitle}
        onClose={handleCancel}
        onSubmit={handleSubmitForm}
        isDisabledSubmit={!isDirty}
        isLoadingSubmit={isLoadingSubmit}
      />

      {errors ? (
        <AlertError
          error={errors as ErrorObj}
          style={{ marginTop: 12, marginBottom: 12 }}
          skipFields={[
            "name",
            "description",
            "parent",
            "parameters",
            "test_cases",
            "started_at",
            "due_date",
            "attributes",
          ]}
        />
      ) : null}
      <Form
        id={`test-plan-${type}-form`}
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
                  <InputFormItem
                    id={`${type}-test-plan-name`}
                    control={control}
                    name="name"
                    label={t("Name")}
                    maxLength={100}
                    required
                    formErrors={formErrors}
                    externalErrors={errors}
                  />
                  <div className={styles.datesRow}>
                    <DateFormItem
                      id={`${type}-test-plan-start-date`}
                      control={control}
                      label={t("Start date")}
                      name="started_at"
                      setDate={setDateFrom}
                      formStyles={{ width: "100%" }}
                      formErrors={formErrors}
                      externalErrors={errors}
                      defaultDate={dayjs()}
                      required
                    />
                    <DateFormItem
                      id={`${type}-test-plan-due-date`}
                      control={control}
                      label={t("Due date")}
                      name="due_date"
                      setDate={setDateTo}
                      disabledDate={disabledDateTo}
                      formStyles={{ width: "100%" }}
                      formErrors={formErrors}
                      externalErrors={errors}
                      defaultDate={dayjs().add(1, "day")}
                      required
                    />
                  </div>
                  <LazyTreeSearchFormItem
                    id={`${type}-test-plan-parent`}
                    control={control}
                    name="parent"
                    label={t("Parent plan")}
                    placeholder={t("Search a test plan")}
                    formErrors={formErrors}
                    externalErrors={errors}
                    // @ts-ignore
                    getData={getPlans}
                    // @ts-ignore
                    getAncestors={getAncestors}
                    selected={selectedParent}
                    onSelect={handleSelectTestPlan}
                    valueKey="title"
                  />
                  {type === "create" && (
                    <TreeSelectFormItem
                      id={`${type}-test-plan-parameters`}
                      control={control}
                      name="parameters"
                      label={t("Parameters")}
                      treeData={parametersTreeView}
                      formErrors={formErrors}
                      externalErrors={errors}
                    />
                  )}
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
                          uploadId={`${type}-test-plan-desc`}
                          textAreaId={`${type}-test-plan-desc-textarea`}
                          fieldProps={field}
                          stateAttachments={{ attachments, setAttachments }}
                          customRequest={handleAttachmentLoad}
                          setValue={setValue}
                        />
                      )}
                    />
                  </Form.Item>
                  <Controller
                    name="attributes"
                    control={control}
                    render={({ field }) => (
                      <Row style={{ flexDirection: "column" }}>
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
                <Flex vertical style={{ flex: "1 1", minWidth: 350 }}>
                  <TestCasesFormItem errors={errors} control={control} />
                </Flex>
              </Flex>
              <FooterView />
            </Flex>
          </Tabs.TabPane>
          <Tabs.TabPane tab={t("Attachments")} key="attachments" className={stylesViewForm.tabPane}>
            <Flex vertical className={stylesViewForm.formWrapper}>
              <Attachment.DropFiles
                attachments={attachments}
                attachmentsIds={attachmentsIds}
                onChange={handleAttachmentChange}
                onLoad={handleAttachmentLoad}
                onRemove={handleAttachmentRemove}
                register={register}
                className={stylesViewForm.attachmentsContainer}
                id="change-test-plan-attachments"
              />
            </Flex>
            <FooterView />
          </Tabs.TabPane>
        </Tabs>
      </Form>
    </>
  )
}

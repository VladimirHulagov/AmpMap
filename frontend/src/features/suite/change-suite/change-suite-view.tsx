import { Flex, Form, Row, Tabs } from "antd"
import { CustomAttributeAdd, CustomAttributeForm } from "entities/custom-attribute/ui"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FooterView } from "widgets"

import { useLazyGetTestSuiteAncestorsQuery, useLazyGetTestSuitesQuery } from "entities/suite/api"

import { ErrorObj } from "shared/hooks"
import stylesViewForm from "shared/styles/view-form.module.css"
import {
  AlertError,
  Attachment,
  FormViewHeader,
  InputFormItem,
  TextAreaWithAttach,
} from "shared/ui"
import { LazyTreeSearchFormItem } from "shared/ui/form-items"

import { useChangeTestSuite } from "./use-change-suite"

interface Props {
  type: "create" | "edit"
}

export const ChangeTestSuiteView = ({ type }: Props) => {
  const { t } = useTranslation()
  const {
    control,
    formErrors,
    errors,
    tab,
    isLoadingSubmit,
    isDirty,
    attachments,
    attachmentsIds,
    selectedParent,
    stateTestSuite,
    register,
    setAttachments,
    handleCancel,
    handleSubmitForm,
    handleTabChange,
    handleAttachmentLoad,
    handleAttachmentChange,
    handleAttachmentRemove,
    handleSelectTestSuite,
    setValue,
    attributes,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
  } = useChangeTestSuite({ type })

  const [getSuites] = useLazyGetTestSuitesQuery()
  const [getAncestors] = useLazyGetTestSuiteAncestorsQuery()

  const formTitle =
    type === "create"
      ? `${t("Create")} ${t("Test Suite")}`
      : `${t("Edit")} ${t("Test Suite")} '${stateTestSuite?.name}'`

  return (
    <>
      <FormViewHeader
        model="test-suite"
        type={type}
        title={formTitle}
        isDisabledSubmit={!isDirty}
        isLoadingSubmit={isLoadingSubmit}
        onClose={handleCancel}
        onSubmit={handleSubmitForm}
      />

      {errors ? (
        <AlertError
          error={errors as ErrorObj}
          style={{ marginTop: 12, marginBottom: 12 }}
          skipFields={["name", "description", "parent", "attributes"]}
        />
      ) : null}
      <Form
        id={`test-suite-${type}-form`}
        layout="vertical"
        onFinish={handleSubmitForm}
        className={stylesViewForm.form}
      >
        <Tabs defaultActiveKey="general" onChange={handleTabChange} activeKey={tab}>
          <Tabs.TabPane tab={t("General")} key="general" className={stylesViewForm.tabPane}>
            <Flex vertical className={stylesViewForm.formWrapper}>
              <Flex className={stylesViewForm.formContainer}>
                <Flex vertical style={{ width: "60%" }}>
                  <InputFormItem
                    id={`${type}-test-suite-name`}
                    control={control}
                    name="name"
                    required
                    label={t("Name")}
                    maxLength={100}
                    formErrors={formErrors}
                    externalErrors={errors}
                  />
                  <LazyTreeSearchFormItem
                    id={`${type}-test-suite-parent`}
                    control={control}
                    // @ts-ignore
                    name="parent"
                    label={t("Parent Test Suite")}
                    placeholder={t("Search a test suite")}
                    formErrors={formErrors}
                    externalErrors={errors}
                    // @ts-ignore
                    getData={getSuites}
                    // @ts-ignore
                    getAncestors={getAncestors}
                    selected={selectedParent}
                    onSelect={handleSelectTestSuite}
                  />
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
                          uploadId={`${type}-test-suite-desc`}
                          textAreaId={`${type}-test-suite-desc-textarea`}
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
                id="change-suite-attachments"
              />
            </Flex>
            <FooterView />
          </Tabs.TabPane>
        </Tabs>
      </Form>
    </>
  )
}

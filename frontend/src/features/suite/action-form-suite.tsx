import { EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Button, Form, Modal } from "antd"
import { BaseButtonProps } from "antd/es/button/button"
import { ReactNode } from "react"
import { Control, FieldErrors, FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useLazyGetTestSuiteAncestorsQuery, useLazyGetTestSuitesQuery } from "entities/suite/api"

import { ErrorObj } from "shared/hooks"
import { AlertError, InputFormItem, TextAreaFormItem } from "shared/ui"
import { LazyTreeSearchFormItem } from "shared/ui/form-items"

interface Props<T extends FieldValues> {
  type: "edit" | "create"
  control: Control<T>
  isShow: boolean
  isLoadingAction: boolean
  isDirty: boolean
  parentSuiteOptions: {
    selectedParent: SelectData | null
    onSelect: (dataValue?: SelectData | undefined | null) => void
    onClear: () => void
  }
  onShow: () => void
  onCancel: () => void
  onSubmitForm: () => void
  as?: ReactNode
  formErrors?: FieldErrors<T>
  externalErrors?: FieldValues | null
  suite?: Suite
  size?: "small" | "default"
  colorType?: BaseButtonProps["type"]
}

export const ActionFormSuite = <T extends FieldValues>({
  as,
  type,
  control,
  suite,
  isShow,
  isLoadingAction,
  isDirty,
  formErrors,
  externalErrors,
  parentSuiteOptions,
  size = "default",
  colorType = "default",
  onShow,
  onCancel,
  onSubmitForm,
}: Props<T>) => {
  const { projectId } = useParams<ParamProjectId>()
  const { t } = useTranslation()
  const [getSuites] = useLazyGetTestSuitesQuery()
  const [getAncestors] = useLazyGetTestSuiteAncestorsQuery()

  const ButtonActionName =
    type === "edit"
      ? t("Edit").toUpperCase()
      : !suite
        ? t("Create").toUpperCase()
        : t("Create Child Test Suite").toUpperCase()
  const ModalTitle =
    type === "edit" ? `${t("Edit Test Suite")} '${suite?.name}'` : t("Create Test Suite")

  return (
    <>
      {as ? (
        <div id={`${type}-test-suite`} onClick={onShow}>
          {as}
        </div>
      ) : (
        <Button
          id={`${type}-test-suite`}
          onClick={onShow}
          icon={type === "edit" ? <EditOutlined /> : <PlusOutlined />}
          type={colorType}
          shape={size === "default" ? "default" : "circle"}
        >
          {size === "default" && ButtonActionName}
        </Button>
      )}

      <Modal
        className={`${type}-test-suite-modal`}
        title={ModalTitle}
        open={isShow}
        onCancel={onCancel}
        centered
        footer={[
          <Button id="clear-btn" key="back" onClick={onCancel}>
            {t("Cancel")}
          </Button>,
          <Button
            id="update-btn"
            key="submit"
            type="primary"
            loading={isLoadingAction}
            onClick={onSubmitForm}
            disabled={!isDirty}
          >
            {type === "edit" ? t("Update") : t("Create")}
          </Button>,
        ]}
      >
        {externalErrors ? (
          <AlertError error={externalErrors as ErrorObj} skipFields={["name", "parent"]} />
        ) : null}
        <Form id={`${type}-test-suite-form`} layout="vertical" onFinish={onSubmitForm}>
          <InputFormItem
            id={`${type}-test-suite-form-name`}
            control={control}
            // @ts-ignore
            name="name"
            required
            label={t("Name")}
            maxLength={100}
            formErrors={formErrors}
            externalErrors={externalErrors}
          />
          <LazyTreeSearchFormItem
            id={`${type}-test-suite-form-parent-suite`}
            control={control}
            // @ts-ignore
            name="parent"
            label={t("Parent Test Suite")}
            placeholder={t("Search a test suite")}
            formErrors={formErrors}
            externalErrors={externalErrors}
            // @ts-ignore
            getData={getSuites}
            // @ts-ignore
            getAncestors={getAncestors}
            dataParams={{
              project: suite?.project.toString() ?? projectId,
            }}
            skipInit={!isShow}
            selected={parentSuiteOptions.selectedParent}
            onSelect={parentSuiteOptions.onSelect}
          />
          <TextAreaFormItem
            id={`${type}-test-suite-form-description`}
            control={control}
            // @ts-ignore
            name="description"
            label={t("Description")}
            formErrors={formErrors}
            externalErrors={externalErrors}
          />
        </Form>
      </Modal>
    </>
  )
}

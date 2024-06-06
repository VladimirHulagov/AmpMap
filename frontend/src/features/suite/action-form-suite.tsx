import { EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Button, Form, Modal } from "antd"
import { Control, FieldErrors, FieldValues } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useLazyGetTestSuitesQuery } from "entities/suite/api"
import { testSuiteSearchValueFormat } from "entities/suite/lib/utils"

import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError, InputFormItem, SearchFormItem, TextAreaFormItem } from "shared/ui"

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
  formErrors?: FieldErrors<T>
  externalErrors?: FieldValues | null
  suite?: Suite
}

export const ActionFormSuite = <T extends FieldValues>({
  type,
  control,
  suite,
  isShow,
  isLoadingAction,
  isDirty,
  formErrors,
  externalErrors,
  parentSuiteOptions,
  onShow,
  onCancel,
  onSubmitForm,
}: Props<T>) => {
  const { projectId } = useParams<ParamProjectId>()
  const [getSuites] = useLazyGetTestSuitesQuery()
  const ButtonActionName =
    type === "edit" ? "Edit" : !suite ? "Create Test Suite" : "Create Child Test Suite"
  const ModalTitle = type === "edit" ? `Edit Test Suite '${suite?.name}'` : "Create Test Suite"

  return (
    <>
      <Button
        id={`${type}-test-suite`}
        onClick={onShow}
        icon={type === "edit" ? <EditOutlined /> : <PlusOutlined />}
        type={type === "edit" ? "default" : "primary"}
        style={type === "edit" ? undefined : { marginLeft: 16 }}
      >
        {ButtonActionName}
      </Button>
      <Modal
        className={`${type}-test-suite-modal`}
        title={ModalTitle}
        open={isShow}
        onCancel={onCancel}
        centered
        footer={[
          <Button id="clear-btn" key="back" onClick={onCancel}>
            Cancel
          </Button>,
          <Button
            id="update-btn"
            key="submit"
            type="primary"
            loading={isLoadingAction}
            onClick={onSubmitForm}
            disabled={!isDirty}
          >
            {type === "edit" ? "Update" : "Create"}
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
            maxLength={100}
            formErrors={formErrors}
            externalErrors={externalErrors}
          />
          <SearchFormItem
            id={`${type}-test-suite-form-parent-suite`}
            control={control}
            // @ts-ignore
            name="parent"
            label="Parent Test Suite"
            placeholder="Search a test suite"
            formErrors={formErrors}
            externalErrors={externalErrors}
            options={{
              getData: getSuites,
              onSelect: parentSuiteOptions.onSelect,
              onClear: parentSuiteOptions.onClear,
              dataParams: {
                project: suite?.project ?? projectId,
                is_flat: true,
              },
              selected: parentSuiteOptions.selectedParent,
              placeholder: "Search a test suite",
              searchKey: "search",
              valueFormat: testSuiteSearchValueFormat,
            }}
          />
          <TextAreaFormItem
            id={`${type}-test-suite-form-description`}
            control={control}
            // @ts-ignore
            name="description"
            formErrors={formErrors}
            externalErrors={externalErrors}
          />
        </Form>
      </Modal>
    </>
  )
}

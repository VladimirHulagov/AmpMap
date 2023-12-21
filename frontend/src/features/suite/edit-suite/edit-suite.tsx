import { EditOutlined } from "@ant-design/icons"
import { Button, Form, Input, Modal } from "antd"
import { Controller } from "react-hook-form"

import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError } from "shared/ui"

import { SearchField } from "widgets/search-field"

import { useSuiteEditModal } from "./use-suite-edit-modal"

export const EditSuite = ({ suite }: { suite: Suite }) => {
  const {
    isShow,
    control,
    isLoadingUpdating,
    isDirty,
    errors,
    selectedParent,
    dataTestSuites,
    isLoadingTestSuites,
    isLastPage,
    handleClearParent,
    handleSelectParent,
    handleSubmitForm,
    handleCancel,
    handleShowEdit,
    handleSearch,
    handleLoadNextPageData,
  } = useSuiteEditModal(suite)

  return (
    <>
      <Button id="edit-test-suite" onClick={handleShowEdit} icon={<EditOutlined />}>
        Edit
      </Button>
      <Modal
        className="edit-test-suite-modal"
        title={`Edit Test Suite '${suite?.name}'`}
        open={isShow}
        onCancel={handleCancel}
        centered
        footer={[
          <Button id="clear-btn" key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            id="update-btn"
            key="submit"
            type="primary"
            loading={isLoadingUpdating}
            onClick={handleSubmitForm}
            disabled={!isDirty}
          >
            Update
          </Button>,
        ]}
      >
        {errors ? <AlertError error={errors as ErrorObj} skipFields={["name", "parent"]} /> : null}

        <Form id="edit-test-suite-form" layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            label="Name"
            validateStatus={errors?.name ? "error" : ""}
            help={errors?.name ? errors.name : ""}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="edit-test-suite-form-name" {...field} />}
            />
          </Form.Item>
          <Form.Item
            label="Parent Test Suite"
            validateStatus={errors?.parent ? "error" : ""}
            help={errors?.parent ? errors.parent : ""}
          >
            <Controller
              name="parent"
              control={control}
              render={() => (
                <SearchField
                  select={selectedParent}
                  data={dataTestSuites}
                  isLoading={isLoadingTestSuites}
                  isLastPage={isLastPage}
                  onClear={handleClearParent}
                  onSearch={handleSearch}
                  onChange={handleSelectParent}
                  handleLoadNextPageData={handleLoadNextPageData}
                  placeholder="Search a test suite"
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
                <Input.TextArea id="edit-test-suite-form-description" rows={4} {...field} />
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

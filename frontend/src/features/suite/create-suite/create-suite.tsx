import { PlusOutlined } from "@ant-design/icons"
import { Button, Form, Input, Modal } from "antd"
import { Controller } from "react-hook-form"

import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError } from "shared/ui"

import { SearchField } from "widgets/search-field"

import { useSuiteCreateModal } from "./use-suite-create-modal"

export const CreateSuite = ({ suite }: { suite?: Suite }) => {
  const {
    isShow,
    control,
    isLoadingCreating,
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
    handleShowCreate,
    handleSearch,
    handleLoadNextPageData,
  } = useSuiteCreateModal(suite)

  return (
    <>
      <Button
        id="create-test-suite-button"
        style={{ marginLeft: 16 }}
        icon={<PlusOutlined />}
        onClick={handleShowCreate}
        type={"primary"}
      >
        {!suite ? "Create Test Suite" : "Create Child Test Suite"}
      </Button>
      <Modal
        className="create-test-suite-modal"
        title="Create Test Suite"
        open={isShow}
        onCancel={handleCancel}
        centered
        footer={[
          <Button id="clear-btn" key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            id="create-btn"
            key="submit"
            type="primary"
            loading={isLoadingCreating}
            onClick={handleSubmitForm}
            disabled={!isDirty}
          >
            Create
          </Button>,
        ]}
      >
        {errors ? <AlertError error={errors as ErrorObj} skipFields={["name", "parent"]} /> : null}

        <Form id="create-test-suite-form" layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            label="Name"
            validateStatus={errors?.name ? "error" : ""}
            help={errors?.name ? errors.name : ""}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="create-test-suite-form-name" {...field} />}
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
                  isLastPage={isLastPage}
                  isLoading={isLoadingTestSuites}
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
                <Input.TextArea id="create-test-suite-form-description" rows={4} {...field} />
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

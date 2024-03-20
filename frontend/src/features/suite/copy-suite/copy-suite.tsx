import { CopyOutlined } from "@ant-design/icons"
import { Alert, Button, Form, Input, Modal, Select } from "antd"
import { Controller } from "react-hook-form"

import { useLazyGetTestSuitesQuery } from "entities/suite/api"

import { SearchFormItem } from "shared/ui"

import { useSuiteCopyModal } from "./use-suite-copy-modal"

export const CopySuite = ({ suite }: { suite: Suite }) => {
  const [getSuites] = useLazyGetTestSuitesQuery()

  const {
    errors,
    formErrors,
    isShow,
    isLoading,
    projects,
    isDisabled,
    control,
    selectedSuite,
    selectedProject,
    handleSubmitForm,
    handleSelectSuite,
    handleClearSuite,
    handleCancel,
    handleShow,
  } = useSuiteCopyModal(suite)

  return (
    <>
      <Button id="copy-test-suite" icon={<CopyOutlined />} onClick={handleShow}>
        Copy
      </Button>
      <Modal
        className="copy-test-suite-modal"
        title={`Copy Test Suite '${suite.name}'`}
        open={isShow}
        onCancel={handleCancel}
        centered
        footer={[
          <Button id="cancel-btn" key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            id="save-btn"
            key="submit"
            type="primary"
            loading={isLoading}
            onClick={handleSubmitForm}
            disabled={isDisabled}
          >
            Save
          </Button>,
        ]}
      >
        <Form id="create-test-suite-form" layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item label="New suite name">
            <Controller
              name="new_name"
              control={control}
              render={({ field }) => (
                <Input
                  id="copy-test-suite-form-name"
                  placeholder="Please enter a name"
                  {...field}
                  autoFocus={true}
                />
              )}
            />
          </Form.Item>
          <Form.Item label="Project">
            <Controller
              name="project"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  id="copy-test-suite-select-project"
                  showSearch
                  placeholder="Please select project"
                  notFoundContent="No matches"
                  defaultActiveFirstOption={false}
                  labelInValue
                  style={{ width: "100%" }}
                  options={projects}
                  value={selectedProject}
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? "")
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? "").toLowerCase())
                  }
                />
              )}
            />
          </Form.Item>
          <SearchFormItem
            id="copy-test-suite-select-suite"
            control={control}
            name="suite"
            label="Suite"
            formErrors={formErrors}
            externalErrors={errors}
            options={{
              getData: getSuites,
              onSelect: handleSelectSuite,
              onClear: handleClearSuite,
              dataParams: {
                project: selectedProject?.value,
                is_flat: true,
              },
              selected: selectedSuite,
              placeholder: "Search a test suite",
              searchKey: "search",
              disabled: !selectedProject,
            }}
          />
        </Form>
        {!!errors.length && (
          <Alert style={{ marginBottom: 0, marginTop: 16 }} description={errors} type="error" />
        )}
      </Modal>
    </>
  )
}

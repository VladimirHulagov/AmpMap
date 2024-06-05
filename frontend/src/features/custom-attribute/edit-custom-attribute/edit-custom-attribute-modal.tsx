import { Button, Checkbox, Form, Input, Modal, Select, Switch, Tree } from "antd"
import Search from "antd/es/input/Search"
import { Controller } from "react-hook-form"

import { customAttributeTypes } from "shared/config/custom-attribute-types"
import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError, HighLighterTesty } from "shared/ui"

import { useCustomAttributeEditModal } from "./use-custom-attribute-edit-modal"

interface Props {
  attribute: CustomAttribute
}

export const EditCustomAttributeModal = ({ attribute }: Props) => {
  const {
    title,
    isShow,
    isLoading,
    errors,
    control,
    isDirty,
    isSuiteSpecific,
    searchText,
    suitesData,
    contentTypes,
    expandedRowKeys,
    handleCancel,
    handleSubmitForm,
    onSearch,
    onRowExpand,
    onSuiteCheck,
  } = useCustomAttributeEditModal({ attribute })

  return (
    <Modal
      className="edit-custom-attribute-modal"
      title={title}
      open={isShow}
      onCancel={handleCancel}
      width="600px"
      centered
      footer={[
        <Button id="close-update-attribute" key="back" onClick={handleCancel}>
          Close
        </Button>,
        <Button
          id="edit-custom-attribute"
          loading={isLoading}
          key="submit"
          onClick={handleSubmitForm}
          type="primary"
          disabled={!isDirty}
        >
          Update
        </Button>,
      ]}
    >
      <>
        {errors ? (
          <AlertError error={errors as ErrorObj} skipFields={["name", "content_types"]} />
        ) : null}

        <Form id="edit-attribute-form" layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            label="Name"
            validateStatus={errors?.name ? "error" : ""}
            help={errors?.name ? errors.name : ""}
            required
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item
            label="Type"
            validateStatus={errors?.type ? "error" : ""}
            help={errors?.type ? errors.type : ""}
            required
          >
            <Controller
              name="type"
              control={control}
              defaultValue={0}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Please select"
                  style={{ width: "100%" }}
                  options={customAttributeTypes}
                />
              )}
            />
          </Form.Item>
          <Form.Item
            label="Applied To"
            validateStatus={errors?.content_types ? "error" : ""}
            help={errors?.content_types ? errors.content_types : ""}
            required
          >
            <Controller
              name="content_types"
              control={control}
              defaultValue={[]}
              render={({ field }) => <Checkbox.Group options={contentTypes} {...field} />}
            />
          </Form.Item>
          <Form.Item label="Required">
            <Controller
              name="is_required"
              control={control}
              render={({ field }) => <Switch {...field} />}
            />
          </Form.Item>
          <Form.Item label="Suite specific">
            <Controller
              name="is_suite_specific"
              control={control}
              render={({ field }) => <Switch {...field} />}
            />
          </Form.Item>
          {isSuiteSpecific && (
            <Form.Item
              validateStatus={errors?.suite_ids ? "error" : ""}
              help={errors?.suite_ids ? errors.suite_ids : ""}
            >
              <Controller
                name="suite_ids"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <>
                    <Search
                      placeholder="Search"
                      onChange={(e) => onSearch(e.target.value)}
                      value={searchText}
                      style={{ marginBottom: "8px" }}
                    />
                    <Tree
                      {...field}
                      titleRender={(node) => (
                        <HighLighterTesty
                          searchWords={searchText}
                          textToHighlight={String(node.title)}
                        />
                      )}
                      height={200}
                      virtual={false}
                      showIcon
                      checkable
                      selectable={false}
                      checkStrictly
                      treeData={suitesData}
                      checkedKeys={field.value}
                      onCheck={onSuiteCheck}
                      expandedKeys={expandedRowKeys}
                      onExpand={(_, record) => {
                        onRowExpand(expandedRowKeys, Number(record.node.key))
                      }}
                    />
                  </>
                )}
              />
            </Form.Item>
          )}
        </Form>
      </>
    </Modal>
  )
}

import { EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Button, Checkbox, Form, Input, Modal, Select, Switch, Tree } from "antd"
import Search from "antd/es/input/Search"
import { Controller } from "react-hook-form"

import { customAttributeTypes } from "shared/config/custom-attribute-types"
import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError, HighLighterTesty } from "shared/ui"

import { PropsChangeCustomAttribute, useChangeCustomAttribute } from "./use-change-custom-attribute"

export const ChangeCustomAttribute = (props: PropsChangeCustomAttribute) => {
  const {
    isShow,
    control,
    isDirty,
    isLoading,
    isSuiteSpecific,
    isTestResultActive,
    expandedRowKeys,
    contentTypes,
    errors,
    searchText,
    suitesData,
    statusesOptions,
    handleClose,
    handleSubmitForm,
    handleShow,
    onRowExpand,
    onSearch,
    onSuiteCheck,
  } = useChangeCustomAttribute(props)

  const { formType, attribute } = props
  const isCreate = formType === "create"
  const title = isCreate ? "Create" : "Edit"
  const titleBtn = isCreate ? "Create" : "Update"

  return (
    <>
      <Button
        id={isCreate ? "create-custom-attribute" : `${formType}-custom-attribute-${attribute?.id}`}
        icon={isCreate ? <PlusOutlined /> : <EditOutlined />}
        type={isCreate ? "primary" : undefined}
        style={isCreate ? { marginBottom: 16, float: "right" } : undefined}
        shape={isCreate ? "default" : "circle"}
        onClick={handleShow}
      >
        {isCreate ? "Create Custom Attribute" : ""}
      </Button>
      <Modal
        className={`${formType}-custom-attribute-modal`}
        title={`${title} Custom Attribute`}
        open={isShow}
        onCancel={handleClose}
        width="600px"
        centered
        destroyOnClose
        footer={[
          <Button id={`close-${formType}-attribute`} key="back" onClick={handleClose}>
            Close
          </Button>,
          <Button
            id={`${formType}-custom-attribute`}
            loading={isLoading}
            key="submit"
            onClick={handleSubmitForm}
            type="primary"
            disabled={!isDirty}
          >
            {titleBtn}
          </Button>,
        ]}
      >
        <>
          {errors ? (
            <AlertError error={errors as ErrorObj} skipFields={["name", "content_types"]} />
          ) : null}

          <Form id={`${formType}-attribute-form`} layout="vertical" onFinish={handleSubmitForm}>
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
              style={{ marginBottom: isTestResultActive ? 4 : undefined }}
            >
              <Controller
                name="content_types"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <Checkbox.Group
                    style={{ flexDirection: "column" }}
                    options={contentTypes}
                    {...field}
                  />
                )}
              />
            </Form.Item>
            {isTestResultActive && (
              <Controller
                name="status_specific"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <div
                    style={{
                      border: "1px solid #d9d9d9",
                      borderRadius: 4,
                      display: "flex",
                      padding: 4,
                      width: "100%",
                    }}
                  >
                    <Checkbox.Group
                      options={statusesOptions}
                      style={{ flexDirection: "column", gap: 4 }}
                      {...field}
                    />
                  </div>
                )}
              />
            )}
            <Form.Item label="Required" style={{ marginTop: isTestResultActive ? 24 : undefined }}>
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
    </>
  )
}

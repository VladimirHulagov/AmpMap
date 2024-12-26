import { EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Button, Checkbox, Form, Input, Modal, Select, Switch } from "antd"
import Search from "antd/es/input/Search"
import { useContext, useMemo } from "react"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useLazyGetTestSuitesQuery } from "entities/suite/api"

import { ProjectContext } from "pages/project"

import { config } from "shared/config"
import { customAttributeTypes } from "shared/config/custom-attribute-types"
import { ErrorObj } from "shared/hooks"
import { LazyNodeProps, LazyTreeNodeApi, LazyTreeView, TreeNodeFetcher } from "shared/libs/tree"
import { AlertError, InfoTooltipBtn } from "shared/ui"

import { SelectSuitesNode } from "./select-suites-node"
import styles from "./styles.module.css"
import { PropsChangeCustomAttribute, useChangeCustomAttribute } from "./use-change-custom-attribute"

export const ChangeCustomAttribute = (props: PropsChangeCustomAttribute) => {
  const { t } = useTranslation()
  const { project } = useContext(ProjectContext)!
  const {
    isShow,
    control,
    isDirty,
    isLoading,
    isSuiteSpecific,
    isTestResultActive,
    contentTypes,
    errors,
    searchDebounce,
    searchText,
    statusesOptions,
    suiteSpecificIds,
    handleClose,
    handleSubmitForm,
    handleShow,
    handleSearchChange,
    handleCheckSuite,
  } = useChangeCustomAttribute(props)

  const initSuiteIds = useMemo(
    () => (suiteSpecificIds ? new Set(suiteSpecificIds) : undefined),
    [suiteSpecificIds]
  )

  const [getSuites] = useLazyGetTestSuitesQuery()
  const fetcher: TreeNodeFetcher<Suite, LazyNodeProps> = async (params) => {
    const res = await getSuites(
      {
        project: project.id,
        page: params.page,
        parent: params.parent ? Number(params.parent) : null,
        page_size: config.defaultTreePageSize,
        ordering: "name",
        treesearch: searchDebounce,
        _n: params._n,
      },
      true
    ).unwrap()
    const data = res.results.map((item) => {
      return {
        id: item.id,
        data: item,
        title: item.name,
        children: [],
        parent: params.parent ? params.parent : null,
        props: {
          canOpen: item.has_children,
          isLeaf: !!item.has_children,
          isLoading: false,
          isChecked: initSuiteIds?.has(item.id) ?? false,
          isHalfChecked: false,
          isMoreLoading: false,
          isOpen: false,
          hasMore: false,
          page: params.page,
          level: params.level,
        },
      }
    })

    return { data, nextInfo: res.pages, _n: params._n }
  }

  const { formType, attribute } = props
  const isCreate = formType === "create"
  const title = isCreate ? t("Create") : t("Edit")
  const titleBtn = isCreate ? t("Create") : t("Update")

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
        {isCreate ? t("Create Custom Attribute") : ""}
      </Button>
      <Modal
        className={`${formType}-custom-attribute-modal`}
        title={`${title} ${t("Custom Attribute")}`}
        open={isShow}
        onCancel={handleClose}
        width="600px"
        centered
        destroyOnClose
        footer={[
          <Button id={`close-${formType}-attribute`} key="back" onClick={handleClose}>
            {t("Close")}
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
              label={t("Name")}
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
              label={t("Type")}
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
                    placeholder={t("Please select")}
                    style={{ width: "100%" }}
                    options={customAttributeTypes}
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label={t("Applied To")}
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
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {contentTypes?.map((contentType) => {
                      const isDisabled = contentType.label === "Test Plan"
                      return (
                        <Checkbox
                          key={contentType.value}
                          value={contentType.value}
                          disabled={isDisabled}
                          checked={field.value?.includes(contentType.value)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...(field.value || []), contentType.value]
                              : field.value?.filter((v: number) => v !== contentType.value)
                            field.onChange(newValue)
                          }}
                        >
                          {contentType.label}
                          {isDisabled && <InfoTooltipBtn title={t("Not supported yet")} />}
                        </Checkbox>
                      )
                    })}
                  </div>
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
            <Form.Item
              label={t("Required")}
              style={{ marginTop: isTestResultActive ? 24 : undefined }}
            >
              <Controller
                name="is_required"
                control={control}
                render={({ field }) => <Switch {...field} />}
              />
            </Form.Item>
            <Form.Item label={t("Suite specific")}>
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
                  render={() => (
                    <>
                      <Search
                        placeholder="Search"
                        onChange={handleSearchChange}
                        value={searchText}
                        style={{ marginBottom: "8px" }}
                      />
                      <div className={styles.treeBlock}>
                        <LazyTreeView
                          fetcher={fetcher}
                          skipInit={!isShow}
                          renderNode={(node) => (
                            <SelectSuitesNode
                              node={node as LazyTreeNodeApi<Suite, LazyNodeProps>} // FIX IT cast type
                              onCheck={handleCheckSuite}
                            />
                          )}
                        />
                      </div>
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

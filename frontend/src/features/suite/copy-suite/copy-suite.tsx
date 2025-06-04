import { CopyOutlined } from "@ant-design/icons"
import { Alert, Form, Input, Modal, Select } from "antd"
import { ReactNode, memo } from "react"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useLazyGetTestSuiteAncestorsQuery, useLazyGetTestSuitesQuery } from "entities/suite/api"

import { Button } from "shared/ui"
import { LazyTreeSearchFormItem } from "shared/ui/form-items"

import { useSuiteCopyModal } from "./use-suite-copy-modal"

interface Props {
  as?: ReactNode
  suite: Suite
  onSubmit?: (newSuite: CopySuiteResponse) => void
}

const TEST_ID = "copy-suite"

export const CopySuite = memo(({ as, suite, onSubmit }: Props) => {
  const { t } = useTranslation()
  const [getSuites] = useLazyGetTestSuitesQuery()
  const [getAncestors] = useLazyGetTestSuiteAncestorsQuery()

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
    handleCancel,
    handleShow,
  } = useSuiteCopyModal(suite, onSubmit)

  return (
    <>
      {as ? (
        <div id="copy-test-suite" onClick={handleShow}>
          {as}
        </div>
      ) : (
        <Button
          id="copy-test-suite"
          color="secondary-linear"
          icon={<CopyOutlined />}
          onClick={handleShow}
        >
          {t("Copy").toUpperCase()}
        </Button>
      )}
      <Modal
        bodyProps={{ "data-testid": `${TEST_ID}-modal-body` }}
        wrapProps={{ "data-testid": `${TEST_ID}-modal-wrapper` }}
        title={
          <span
            data-testid={`${TEST_ID}-modal-title`}
          >{`${t("Copy Test Suite")} '${suite.name}'`}</span>
        }
        open={isShow}
        onCancel={handleCancel}
        centered
        footer={[
          <Button id="cancel-btn" key="back" onClick={handleCancel} color="secondary-linear">
            {t("Cancel")}
          </Button>,
          <Button
            id="save-btn"
            key="submit"
            color="accent"
            loading={isLoading}
            onClick={handleSubmitForm}
            disabled={isDisabled}
          >
            {t("Save")}
          </Button>,
        ]}
      >
        <Form id="create-test-suite-form" layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item label={t("New Suite name")}>
            <Controller
              name="new_name"
              control={control}
              render={({ field }) => (
                <Input
                  id="copy-test-suite-form-name"
                  placeholder={t("Please enter a name")}
                  {...field}
                  autoFocus
                />
              )}
            />
          </Form.Item>
          <Form.Item label={t("Project")}>
            <Controller
              name="project"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  id="copy-test-suite-select-project"
                  showSearch
                  placeholder={t("Please select project")}
                  notFoundContent={
                    <span style={{ color: "var(--y-color-control-placeholder)" }}>
                      {t("No matches")}
                    </span>
                  }
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
          <LazyTreeSearchFormItem
            id="copy-test-suite-select-suite"
            control={control}
            name="suite"
            label={t("Suite")}
            placeholder={t("Search a test suite")}
            formErrors={formErrors}
            // @ts-ignore
            getData={getSuites}
            // @ts-ignore
            getAncestors={getAncestors}
            dataParams={{
              project: String(selectedProject?.value),
            }}
            skipInit={!isShow}
            selected={selectedSuite}
            onSelect={handleSelectSuite}
          />
        </Form>
        {!!errors.length && (
          <Alert style={{ marginBottom: 0, marginTop: 16 }} description={errors} type="error" />
        )}
      </Modal>
    </>
  )
})

CopySuite.displayName = "CopySuite"

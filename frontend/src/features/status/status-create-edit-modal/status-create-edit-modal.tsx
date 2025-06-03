import { ColorPicker, Flex, Form, Input, Modal } from "antd"
import classNames from "classnames"
import { useAdministrationStatusModal } from "entities/status/model"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import ContextMenuIcon from "shared/assets/yi-icons/context-menu.svg?react"
import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError, Button } from "shared/ui"

import styles from "./styles.module.css"

const BASE_COLORS = ["#B2D860", "#2D7365", "#468AA5", "#7883E2", "#C088FF", "#EB76BE", "#E4387A"]

interface Props {
  data: ReturnType<typeof useAdministrationStatusModal>
}

const TEST_ID = "create-edit-status"

export const StatusCreateEditModal = ({ data }: Props) => {
  const { t } = useTranslation()
  const {
    title,
    isShow,
    mode,
    isLoading,
    errors,
    control,
    isDirty,
    handleCancel,
    handleSubmitForm,
  } = data

  return (
    <Modal
      bodyProps={{ "data-testid": `${TEST_ID}-modal-body` }}
      wrapProps={{ "data-testid": `${TEST_ID}-modal-wrapper` }}
      title={<span data-testid={`${TEST_ID}-modal-title`}>{title}</span>}
      open={isShow}
      onCancel={handleCancel}
      width={404}
      centered
      footer={[
        <Button
          id="close-update-create-status"
          key="back"
          onClick={handleCancel}
          color="secondary-linear"
        >
          {t("Close")}
        </Button>,
        <Button
          id="update-create-status"
          loading={isLoading}
          key="submit"
          onClick={handleSubmitForm}
          color="accent"
          disabled={!isDirty}
        >
          {mode === "edit" ? t("Update") : t("Create")}
        </Button>,
      ]}
    >
      <>
        {errors ? <AlertError error={errors as ErrorObj} skipFields={["name"]} /> : null}

        <Form layout="vertical" onFinish={handleSubmitForm} data-testid={`${mode}-status-form`}>
          <Form.Item
            label={t("Name")}
            validateStatus={errors?.name ? "error" : ""}
            help={errors?.name ? errors.name : ""}
            required
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input {...field} data-testid={`${mode}-status-name`} allowClear />
              )}
            />
          </Form.Item>
          <Form.Item
            label={t("Color")}
            validateStatus={errors?.color ? "error" : ""}
            help={errors?.color ? errors.color : ""}
          >
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <Flex align="center" justify="space-between">
                  {BASE_COLORS.map((baseColor, index) => (
                    <div
                      key={index}
                      className={classNames(styles.baseColorBox, {
                        [styles.activeBox]: field.value === baseColor,
                      })}
                      onClick={() => field.onChange(baseColor)}
                      data-testid={`${mode}-status-color-${baseColor}-button`}
                    >
                      <div className={styles.boxInner} style={{ backgroundColor: baseColor }} />
                    </div>
                  ))}
                  <ColorPicker
                    value={field.value}
                    format="rgb"
                    disabledAlpha
                    onChangeComplete={(color) => {
                      field.onChange(color.toRgbString())
                    }}
                    data-testid={`${mode}-status-color-picker-button`}
                    getPopupContainer={(triggerNode) => {
                      triggerNode.setAttribute("id", `${mode}-status-color-picker-popup`)
                      return triggerNode
                    }}
                  >
                    <div className={styles.baseColorBox}>
                      <div
                        className={styles.boxInner}
                        style={{
                          backgroundColor: field.value || "var(--y-color-background-alternative)",
                        }}
                      >
                        <ContextMenuIcon width={24} />
                      </div>
                    </div>
                  </ColorPicker>
                </Flex>
              )}
            />
          </Form.Item>
        </Form>
      </>
    </Modal>
  )
}

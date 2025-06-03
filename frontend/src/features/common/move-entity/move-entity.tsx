import { Alert, Flex, Form, Modal } from "antd"
import { FieldValues, Path } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { LazyGetTriggerType } from "app/export-types"

import StickArrowIcon from "shared/assets/yi-icons/stick-arrow.svg?react"
import { Button } from "shared/ui"
import { LazyTreeSearchFormItem } from "shared/ui/form-items"

import { useMoveEntityModal } from "./use-move-entity"

interface Props<T, K extends FieldValues> {
  onSubmit: (plan: number, onLoading?: (toggle: boolean) => void) => Promise<void>
  getEntities: LazyGetTriggerType<T>
  getAncestor: LazyGetTriggerType<T>
  name: Path<K>
  title: string
  label: string
  placeholder: string
  id: "cases" | "tests"
  isLoading?: boolean
}

export const MoveEntity = <T, K extends FieldValues>({
  isLoading: initIsLoading,
  onSubmit,
  getEntities,
  getAncestor,
  id,
  title,
  label,
  name,
  placeholder,
}: Props<T, K>) => {
  const { t } = useTranslation()

  const {
    isLoading,
    isShow,
    handleCancel,
    handleShow,
    selectedEntity,
    handleSelectEntity,
    errors,
    formErrors,
    control,
    handleSubmitForm,
  } = useMoveEntityModal({ isLoading: initIsLoading ?? false, onSubmit })

  const titleButton = id === "cases" ? t("Move cases") : t("Move tests")

  return (
    <>
      <Flex align="center" id={`move-${id}`} onClick={handleShow}>
        <StickArrowIcon width={16} height={16} style={{ marginRight: 8 }} />
        {titleButton}
      </Flex>
      <Modal
        title={title}
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
            disabled={!selectedEntity}
            onClick={handleSubmitForm}
          >
            {t("Move")}
          </Button>,
        ]}
      >
        <Form id={`move-${id}-form`} layout="vertical" onFinish={handleSubmitForm}>
          <LazyTreeSearchFormItem
            id={`move-${id}-select`}
            control={control}
            // @ts-ignore
            name={name}
            label={label}
            placeholder={placeholder}
            formErrors={formErrors}
            externalErrors={errors}
            // @ts-ignore
            getData={getEntities}
            // @ts-ignore
            getAncestors={getAncestor}
            skipInit={!isShow}
            selected={selectedEntity}
            onSelect={handleSelectEntity}
          />
        </Form>
        {!!errors.length && (
          <Alert style={{ marginBottom: 0, marginTop: 16 }} description={errors} type="error" />
        )}
      </Modal>
    </>
  )
}

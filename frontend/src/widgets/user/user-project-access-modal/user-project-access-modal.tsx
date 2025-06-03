import { Form, Modal, Select } from "antd"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { UserSearchInput } from "entities/user/ui"

import { ErrorObj } from "shared/hooks"
import { AlertError, Button } from "shared/ui"

import { useUserProjectAccessModal } from "./use-user-project-access-modal"

const TEST_ID = "user-project-access"

export const UserProjectAccessModal = () => {
  const { t } = useTranslation()
  const {
    isOpenned,
    handleClose,
    isLoading,
    handleSubmitForm,
    isDirty,
    errors,
    handleUserChange,
    handleUserClear,
    selectedUser,
    control,
    roles,
    title,
    isEditMode,
  } = useUserProjectAccessModal()

  return (
    <Modal
      bodyProps={{ "data-testid": `${TEST_ID}-modal-body` }}
      wrapProps={{ "data-testid": `${TEST_ID}-modal-wrapper` }}
      title={<span data-testid={`${TEST_ID}-modal-title`}>{title}</span>}
      open={isOpenned}
      onCancel={handleClose}
      width="600px"
      centered
      footer={[
        <Button
          id="close-create-edit-user"
          key="back"
          onClick={handleClose}
          color="secondary-linear"
        >
          {t("Close")}
        </Button>,
        <Button
          id={`${TEST_ID}-submit`}
          loading={isLoading}
          key="submit"
          onClick={handleSubmitForm}
          color="accent"
          disabled={!isDirty}
        >
          {isEditMode ? t("Update") : t("Create")}
        </Button>,
      ]}
    >
      <>
        {errors ? <AlertError error={errors as ErrorObj} skipFields={["user", "role"]} /> : null}

        <Form id="create-edit-user-form" layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            label={t("Name")}
            validateStatus={errors?.user ? "error" : ""}
            help={errors?.user ?? ""}
            required
          >
            <UserSearchInput
              selectedUser={selectedUser}
              handleChange={handleUserChange}
              handleClear={handleUserClear}
            />
          </Form.Item>
          <Form.Item
            label={t("Roles")}
            validateStatus={errors?.roles ? "error" : ""}
            help={errors?.roles ?? ""}
            required
          >
            <Controller
              name="roles"
              control={control}
              render={({ field }) => {
                return (
                  <Select
                    mode="multiple"
                    {...field}
                    placeholder={t("Please select roles")}
                    style={{ width: "100%" }}
                    id="user-project-access-roles"
                    filterOption={false}
                    showSearch={false}
                  >
                    {roles.map((status) => (
                      <Select.Option key={status.id} value={Number(status.id)}>
                        {status.name}
                      </Select.Option>
                    ))}
                  </Select>
                )
              }}
            />
          </Form.Item>
        </Form>
      </>
    </Modal>
  )
}

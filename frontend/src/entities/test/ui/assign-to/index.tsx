import { UserAddOutlined, UserOutlined } from "@ant-design/icons"
import { Button, Divider, Form, Modal, Select, Typography } from "antd"
import { Controller } from "react-hook-form"

import { useAssignTo } from "entities/test/model"

import styles from "./styles.module.css"

export const AssignTo = () => {
  const {
    activeTest,
    isOpenModal,
    errors,
    control,
    isDirty,
    selectUsers,
    isLoadingUpdateTest,
    handleClose,
    handleOpenAssignModal,
    handleSubmitForm,
    handleAssignUserChange,
    handleAssignUserClear,
  } = useAssignTo()

  return (
    <>
      <Divider orientation="left" style={{ margin: 0 }} orientationMargin={0}>
        Assign To
      </Divider>
      <div style={{ padding: 8, marginBottom: 8 }}>
        <Typography id="test-case-assign-to">
          <div className={styles.assignBlock}>
            <UserOutlined />
            <Typography.Text id="test-case-assign-to-user">
              {activeTest?.assignee_username ? activeTest?.assignee_username : "Nobody"}
            </Typography.Text>

            <Button
              id="assign-to-btn"
              icon={<UserAddOutlined style={{ fontSize: 14 }} />}
              key="submit"
              onClick={handleOpenAssignModal}
              type="ghost"
              size="small"
            >
              Assign To
            </Button>
          </div>
        </Typography>
      </div>
      <Modal
        className="test-assign-to-modal"
        title="Assign To"
        open={isOpenModal}
        onCancel={handleClose}
        footer={[
          <Button key="back" onClick={handleClose}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSubmitForm}
            disabled={!isDirty}
            loading={isLoadingUpdateTest}
          >
            Save
          </Button>,
        ]}
      >
        <Form id="test-assign-form" layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            label="Name"
            validateStatus={errors?.assignUserId ? "error" : ""}
            help={errors?.assignUserId || ""}
          >
            <Controller
              name="assignUserId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  allowClear
                  autoFocus
                  showSearch
                  placeholder="Select a user"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? "")
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? "").toLowerCase())
                  }
                  options={selectUsers}
                  onChange={handleAssignUserChange}
                  onClear={handleAssignUserClear}
                />
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

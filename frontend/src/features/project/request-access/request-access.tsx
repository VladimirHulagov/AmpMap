import { UnlockOutlined } from "@ant-design/icons"
import { Button, Form, Input, Modal, notification } from "antd"
import { useForm } from "antd/lib/form/Form"

import { useRequestAccessMutation } from "entities/project/api"

import styles from "./styles.module.css"

interface Props {
  project: Project
}

export const RequestProjectAccess = ({ project }: Props) => {
  const [form] = useForm<{ reason: string }>()
  const [requestAccess] = useRequestAccessMutation()

  const handleRequestAccess = () => {
    form.validateFields().then(async (values) => {
      try {
        const { reason } = values
        await requestAccess({ id: project.id, reason }).unwrap()
        notification.success({ message: "Success", description: "Request has been sent" })
      } catch (e) {
        notification.error({ message: "Error", description: "Failed to send a reqeust" })
      }
    })
  }

  return (
    <>
      <Button
        type="primary"
        block
        className={styles.requestBtn}
        icon={<UnlockOutlined />}
        onClick={() =>
          Modal.confirm({
            title: "Request Access",
            icon: null,
            content: (
              <Form form={form}>
                <Form.Item name="reason" label="Reason">
                  <Input />
                </Form.Item>
              </Form>
            ),
            onOk: handleRequestAccess,
          })
        }
      >
        Request access to {project.name}
      </Button>
    </>
  )
}

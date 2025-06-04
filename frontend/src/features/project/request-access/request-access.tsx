import { UnlockOutlined } from "@ant-design/icons"
import { Form, Input, Tooltip } from "antd"
import { useForm } from "antd/lib/form/Form"
import classNames from "classnames"
import { useTranslation } from "react-i18next"

import { useRequestAccessMutation } from "entities/project/api"

import { antdModalConfirm, antdNotification } from "shared/libs/antd-modals"
import { Button } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  project: Project
  type?: "min" | "default"
}

export const RequestProjectAccess = ({ project, type = "default" }: Props) => {
  const { t } = useTranslation()
  const [form] = useForm<{ reason: string }>()
  const [requestAccess] = useRequestAccessMutation()

  const handleRequestAccess = () => {
    form.validateFields().then(async (values) => {
      try {
        const { reason } = values
        await requestAccess({ id: project.id, reason }).unwrap()
        antdNotification.success("request-access", {
          description: t("Request has been sent"),
        })
      } catch (e) {
        antdNotification.error("request-access", {
          description: t("Failed to send a reqeust"),
        })
      }
    })
  }

  const TEXT = `${t("Request access to")} ${project.name}`
  const BUTTON = (
    <Button
      color="primary"
      block
      className={classNames(styles.requestBtn, { [styles.minBtn]: type === "min" })}
      icon={<UnlockOutlined />}
      onClick={() =>
        antdModalConfirm("request-access", {
          title: t("Request Access"),
          icon: null,
          okText: t("Send"),
          onOk: handleRequestAccess,
          content: (
            <Form form={form}>
              <Form.Item name="reason" label={t("Reason")}>
                <Input />
              </Form.Item>
            </Form>
          ),
        })
      }
    >
      {type === "default" ? TEXT : null}
    </Button>
  )

  if (type === "default") return BUTTON
  return (
    <Tooltip title={TEXT} placement="top">
      {BUTTON}
    </Tooltip>
  )
}

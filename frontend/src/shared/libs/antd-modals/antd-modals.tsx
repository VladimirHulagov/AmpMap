import { CloseCircleOutlined } from "@ant-design/icons"
import { Modal, ModalFuncProps, notification } from "antd"
import { ArgsProps } from "antd/es/notification"
import i18n from "i18next"

import TickIcon from "shared/assets/yi-icons/tick.svg?react"

import styles from "./styles.module.css"

export const antdModalConfirm = (
  id: string,
  {
    okText = i18n.t("Ok"),
    cancelText = i18n.t("Cancel"),
    title,
    okButtonProps,
    cancelButtonProps,
    bodyProps,
    ...props
  }: ModalFuncProps
) => {
  return Modal.confirm({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    bodyProps: { "data-testid": `${id}-modal-confirm`, ...bodyProps },
    okButtonProps: { "data-testid": `${id}-button-confirm`, ...okButtonProps },
    cancelButtonProps: { "data-testid": `${id}-button-cancel`, ...cancelButtonProps },
    title: <span data-testid={`${id}-modal-title`}>{title}</span>,
    okText,
    cancelText,
    ...props,
  })
}

export const antdModalCloseConfirm = (cb: () => void) => {
  antdModalConfirm("close-modal-confirm", {
    title: i18n.t("Do you want to close?"),
    content: i18n.t("You will lose your data if you continue!"),
    onOk: () => cb(),
  })
}

type NotificationProps = Omit<ArgsProps, "message" | "description"> & {
  description?: string | React.ReactNode
  closable?: boolean
}

export const antdNotification = {
  success: (id: string, props?: NotificationProps) => {
    const { description, closable = true, ...rest } = props ?? {}
    return notification.success({
      message: <div data-testid={`${id}-notification-success-message`}>{description}</div>,
      props: {
        "data-testid": `${id}-notification-success`,
      },
      closable,
      placement: "bottom",
      className: styles.notificationWrapper,
      description: null,
      icon: <TickIcon />,
      ...rest,
    })
  },
  error: (id: string, props?: NotificationProps) => {
    const { description, closable = true, ...rest } = props ?? {}
    return notification.error({
      message: <span data-testid={`${id}-notification-error-message`}>{description}</span>,
      props: {
        "data-testid": `${id}-notification-error`,
      },
      closable,
      placement: "bottom",
      className: styles.notificationWrapper,
      description: null,
      icon: <CloseCircleOutlined style={{ color: "var(--y-color-error)" }} />,
      ...rest,
    })
  },
}

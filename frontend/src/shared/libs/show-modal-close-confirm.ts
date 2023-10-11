import { Modal } from "antd"

export const showModalCloseConfirm = (cb: () => void) => {
  Modal.confirm({
    title: "Do you want to close?",
    content: "You will lose your data if you continue!",
    okText: "Ok",
    cancelText: "Cancel",
    onOk: () => cb(),
  })
}

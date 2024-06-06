import { EditOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { showEditModal } from "entities/custom-attribute/model"

import { useAppDispatch } from "app/hooks"

import { EditCustomAttributeModal } from "./edit-custom-attribute-modal"

interface Props {
  attribute: CustomAttribute
}

export const EditCustomAttribute = ({ attribute }: Props) => {
  const dispatch = useAppDispatch()

  const handleEditClick = () => {
    dispatch(showEditModal({ attribute }))
  }

  return (
    <>
      <Button
        id={`edit-custom-attribute-${attribute.id}`}
        icon={<EditOutlined />}
        shape="circle"
        onClick={handleEditClick}
      />
      <EditCustomAttributeModal attribute={attribute} />
    </>
  )
}

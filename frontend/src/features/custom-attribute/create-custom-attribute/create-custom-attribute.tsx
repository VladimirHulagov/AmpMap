import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { showCreateModal } from "entities/custom-attribute/model"

import { useAppDispatch } from "app/hooks"

import { CreateCustomAttributeModal } from "./create-custom-attribute-modal"

export const CreateCustomAttribute = () => {
  const dispatch = useAppDispatch()

  const handleCreateClick = () => {
    dispatch(showCreateModal())
  }

  return (
    <>
      <Button
        id="create-custom-attribute"
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleCreateClick}
        style={{ marginBottom: 16, float: "right" }}
      >
        Create Custom Attribute
      </Button>
      <CreateCustomAttributeModal />
    </>
  )
}

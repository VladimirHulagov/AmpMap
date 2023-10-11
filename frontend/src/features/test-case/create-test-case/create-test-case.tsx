import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"

import { useAppDispatch } from "app/hooks"

import { clearTestCase, showCreateModal } from "entities/test-case/model"

import { CreateTestCaseModal } from "./create-test-case-modal"

export const CreateTestCase = () => {
  const dispatch = useAppDispatch()

  return (
    <>
      <Button
        id="create-test-case"
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          dispatch(clearTestCase())
          dispatch(showCreateModal())
        }}
      >
        Create Test Case
      </Button>
      <CreateTestCaseModal />
    </>
  )
}

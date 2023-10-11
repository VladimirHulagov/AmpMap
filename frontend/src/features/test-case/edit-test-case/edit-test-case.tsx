import { EditOutlined } from "@ant-design/icons"
import { Button } from "antd"

import { useAppDispatch } from "app/hooks"

import { showEditModal } from "entities/test-case/model"

import { EditTestCaseModal } from "./edit-test-case-modal"

export const EditTestCase = ({ testCase }: { testCase: ITestCase }) => {
  const dispatch = useAppDispatch()

  const handleEdit = () => {
    dispatch(showEditModal())
  }

  return (
    <>
      <Button id="edit-test-case-detail" icon={<EditOutlined />} onClick={handleEdit}>
        Edit
      </Button>
      <EditTestCaseModal testCase={testCase} />
    </>
  )
}

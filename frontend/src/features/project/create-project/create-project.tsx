import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useState } from "react"

import { CreateProjectModal } from "./create-project-modal"

export const CreateProject = () => {
  const [isShow, setIsShow] = useState(false)

  const handleClick = () => {
    setIsShow(true)
  }

  return (
    <>
      <Button id="create-project" icon={<PlusOutlined />} type="primary" onClick={handleClick}>
        Create Project
      </Button>
      <CreateProjectModal isShow={isShow} setIsShow={setIsShow} />
    </>
  )
}

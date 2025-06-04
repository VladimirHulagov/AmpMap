import { useState } from "react"
import { useTranslation } from "react-i18next"

import DeleteIcon from "shared/assets/yi-icons/delete.svg?react"
import { Button } from "shared/ui"

import { DeleteTestCaseModal } from "./delete-test-case-modal"

interface Props {
  testCase: TestCase
  onSubmit?: (testCase: TestCase) => void
}

export const DeleteTestCase = ({ testCase, onSubmit }: Props) => {
  const { t } = useTranslation()
  const [isShowTestCaseDeleteModal, setIsShowTestCaseDeleteModal] = useState(false)

  const handleDelete = () => {
    setIsShowTestCaseDeleteModal(true)
  }

  return (
    <>
      <Button
        id="delete-test-case-detail"
        onClick={handleDelete}
        icon={<DeleteIcon width={16} height={16} />}
        danger
        color="secondary-linear"
      >
        {t("Delete")}
      </Button>
      <DeleteTestCaseModal
        isShow={isShowTestCaseDeleteModal}
        setIsShow={setIsShowTestCaseDeleteModal}
        testCase={testCase}
        onSubmit={onSubmit}
      />
    </>
  )
}

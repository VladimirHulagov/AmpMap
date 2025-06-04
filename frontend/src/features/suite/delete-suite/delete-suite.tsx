import { ReactNode, memo, useState } from "react"
import { useTranslation } from "react-i18next"

import DeleteIcon from "shared/assets/yi-icons/delete.svg?react"
import { Button } from "shared/ui"

import { DeleteTestSuiteModal } from "./delete-test-suite-modal"

interface Props {
  as?: ReactNode
  suite: Suite
  onSubmit?: (suite: Suite) => void
}

export const DeleteSuite = memo(({ as, suite, onSubmit }: Props) => {
  const { t } = useTranslation()
  const [isShowTestSuiteDeleteModal, setIsShowTestSuiteDeleteModal] = useState(false)

  const handleShow = () => {
    setIsShowTestSuiteDeleteModal(true)
  }

  return (
    <>
      {as ? (
        <div id="delete-test-suite" onClick={handleShow}>
          {as}
        </div>
      ) : (
        <Button
          id="delete-test-suite"
          color="secondary-linear"
          icon={<DeleteIcon width={16} height={16} />}
          onClick={handleShow}
        >
          {t("Delete")}
        </Button>
      )}
      <DeleteTestSuiteModal
        testSuite={suite}
        isShow={isShowTestSuiteDeleteModal}
        setIsShow={setIsShowTestSuiteDeleteModal}
        onSubmit={onSubmit}
      />
    </>
  )
})

DeleteSuite.displayName = "DeleteSuite"

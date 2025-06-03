import { ReactNode, memo, useState } from "react"
import { useTranslation } from "react-i18next"

import DeleteIcon from "shared/assets/yi-icons/delete.svg?react"
import { Button } from "shared/ui"

import { DeleteTestPlanModal } from "./delete-test-plan-modal"

interface Props {
  as?: ReactNode
  testPlan: TestPlan
  onSubmit?: (plan: TestPlan) => void
}

export const DeleteTestPlan = memo(({ as, testPlan, onSubmit }: Props) => {
  const { t } = useTranslation()
  const [isShow, setIsShow] = useState(false)

  const handleShow = () => {
    setIsShow(true)
  }

  return (
    <>
      {as ? (
        <div id="edit-test-plan" onClick={handleShow}>
          {as}
        </div>
      ) : (
        <Button
          id="delete-test-plan"
          icon={<DeleteIcon width={18} height={18} />}
          onClick={handleShow}
          color="secondary-linear"
        >
          {t("Delete")}
        </Button>
      )}
      <DeleteTestPlanModal
        isShow={isShow}
        setIsShow={setIsShow}
        testPlan={testPlan}
        onSubmit={onSubmit}
      />
    </>
  )
})

DeleteTestPlan.displayName = "DeleteTestPlan"

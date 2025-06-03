import { ReactNode, memo, useState } from "react"
import { useTranslation } from "react-i18next"

import ArchiveIcon from "shared/assets/yi-icons/archive.svg?react"
import { Button } from "shared/ui"

import { ArchiveTestPlanModal } from "./archive-test-plan-modal"

interface Props {
  as?: ReactNode
  testPlan: TestPlan
  onSubmit?: (plan: TestPlan) => void
}

export const ArchiveTestPlan = memo(({ as, testPlan, onSubmit }: Props) => {
  const { t } = useTranslation()
  const [isShow, setIsShow] = useState(false)

  const handleShow = () => {
    setIsShow(true)
  }

  return (
    <>
      {as ? (
        <div id="archive-test-plan" onClick={handleShow}>
          {as}
        </div>
      ) : (
        <Button
          id="archive-test-plan"
          icon={<ArchiveIcon width={16} height={16} />}
          onClick={handleShow}
          color="secondary-linear"
        >
          {t("Archive")}
        </Button>
      )}

      <ArchiveTestPlanModal
        isShow={isShow}
        setIsShow={setIsShow}
        testPlan={testPlan}
        onSubmit={onSubmit}
      />
    </>
  )
})

ArchiveTestPlan.displayName = "ArchiveTestPlan"

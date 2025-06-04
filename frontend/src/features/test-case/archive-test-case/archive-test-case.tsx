import { Dropdown, MenuProps } from "antd"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { Button } from "shared/ui"

import { DeleteTestCase } from "../delete-test-case/delete-test-case"
import { ArchiveTestCaseModal } from "./archive-test-case-modal"
import styles from "./styles.module.css"

interface Props {
  testCase: TestCase
  onSubmit?: (testCase: TestCase) => void
}

export const ArchiveTestCase = ({ testCase, onSubmit }: Props) => {
  const { t } = useTranslation()
  const [isShow, setIsShow] = useState(false)

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: <DeleteTestCase testCase={testCase} onSubmit={onSubmit} />,
    },
  ]

  return (
    <>
      <Dropdown menu={{ items }} trigger={["hover"]}>
        <Button style={{ gap: 4 }} color="secondary-linear">
          <span data-testid="archive-test-case-btn" onClick={() => setIsShow(true)}>
            {t("Archive")}
          </span>
          <ArrowIcon
            className={styles.archiveMenuArrow}
            data-testid="archive-test-case-dropdown-arrow"
          />
        </Button>
      </Dropdown>
      <ArchiveTestCaseModal
        isShow={isShow}
        setIsShow={setIsShow}
        testCase={testCase}
        onSubmit={onSubmit}
      />
    </>
  )
}

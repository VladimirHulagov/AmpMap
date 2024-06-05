import { Button, Input } from "antd"
import { useState } from "react"

import { SelectSuiteModal } from "./select-suite-modal"

interface Props {
  suiteName: string
  selectedSuiteId: number
  onChange: (event: number | React.ChangeEvent<Element>) => void
  treeSuites: SuiteTree[]
}

export const SelectSuiteTestCase = ({
  suiteName,
  selectedSuiteId,
  treeSuites,
  onChange,
}: Props) => {
  const [isSelectSuiteModalOpened, setIsSelectSuiteModalOpened] = useState(false)

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Input id="suite-edit-input" value={suiteName} readOnly style={{ width: "100%" }} />
        <Button
          id="suite-edit-btn"
          type="primary"
          style={{ width: 80, marginLeft: 10 }}
          onClick={() => setIsSelectSuiteModalOpened(true)}
        >
          Edit
        </Button>
      </div>
      <SelectSuiteModal
        opened={isSelectSuiteModalOpened}
        onCancel={() => setIsSelectSuiteModalOpened(false)}
        onSubmit={(value: number) => {
          onChange(value)
          setIsSelectSuiteModalOpened(false)
        }}
        treeSuites={treeSuites}
        selectedSuiteId={selectedSuiteId}
      />
    </>
  )
}

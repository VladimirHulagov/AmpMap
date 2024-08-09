import { Button, Input } from "antd"
import { useState } from "react"

import { SelectSuiteModal } from "./select-suite-modal"

interface Props {
  suiteName: string
  selectedSuiteId: number
  onChange: (event: { id: number; name?: string }) => void
}

export const SelectSuiteTestCase = ({ suiteName, selectedSuiteId, onChange }: Props) => {
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
        onSubmit={(value: number, name?: string) => {
          onChange({
            id: value,
            name,
          })
          setIsSelectSuiteModalOpened(false)
        }}
        selectedSuiteId={selectedSuiteId}
      />
    </>
  )
}

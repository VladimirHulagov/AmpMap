import { Button } from "antd"
import { useState } from "react"

import { UserSearchInput } from "entities/user/ui"

interface SuiteFiltersDrowdownProps {
  onAssignUserChange?: (data?: SelectData) => void
  onUnAssignUserClick?: () => void
  onReset?: () => void
  close: () => void
}

export const AssigneeFiltersDrowdown = ({
  onAssignUserChange,
  onUnAssignUserClick,
  onReset,
  close,
}: SuiteFiltersDrowdownProps) => {
  const [selectedUser, setSelectedUser] = useState<SelectData | null>(null)
  const [isUnassigned, setIsUnassigned] = useState(false)

  const handleAssignUserChange = (data?: SelectData) => {
    if (!data) return
    setSelectedUser(data)
    setIsUnassigned(false)

    if (onAssignUserChange) {
      onAssignUserChange(data)
    }

    close()
  }

  const handleAssignUserClear = () => {
    setSelectedUser(null)

    if (onAssignUserChange) {
      onAssignUserChange(undefined)
    }
  }

  const handleSelectUnassigned = () => {
    setSelectedUser(null)
    setIsUnassigned(true)

    if (onUnAssignUserClick) {
      onUnAssignUserClick()
    }

    close()
  }

  const handleReset = () => {
    setSelectedUser(null)
    setIsUnassigned(false)

    if (onReset) {
      onReset()
    }

    close()
  }

  return (
    <div
      id="assignee-filters-dropdown"
      style={{ padding: 8, width: 270 }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <UserSearchInput
        selectedUser={selectedUser}
        handleChange={handleAssignUserChange}
        handleClear={handleAssignUserClear}
      />
      <div style={{ display: "flex", flexDirection: "row", gap: 6, marginTop: 8 }}>
        <Button
          size="small"
          onClick={handleSelectUnassigned}
          style={{ padding: "0 20px" }}
          type={isUnassigned ? "primary" : undefined}
        >
          Search Unassigned
        </Button>
        <Button
          onClick={handleReset}
          size="small"
          style={{ padding: "0 20px", marginLeft: "auto" }}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}

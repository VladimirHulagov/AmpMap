import { BaseButtonProps } from "antd/es/button/button"
import { ReactNode, memo } from "react"

import { ActionFormSuite } from ".."
import { useSuiteCreateModal } from "./use-suite-create-modal"

interface Props {
  as?: ReactNode
  suite?: Suite
  size?: "small" | "default"
  colorType?: BaseButtonProps["type"]
  onSubmit?: (suite: Suite) => void
}

export const CreateSuite = memo(
  ({ as, suite, onSubmit, size = "default", colorType = "default" }: Props) => {
    const {
      isShow,
      control,
      isLoadingCreating,
      isDirty,
      errors,
      formErrors,
      selectedParent,
      handleClearParent,
      handleSelectParent,
      handleSubmitForm,
      handleCancel,
      handleShowCreate,
    } = useSuiteCreateModal(onSubmit, suite)

    return (
      <ActionFormSuite
        as={as}
        type="create"
        size={size}
        control={control}
        isDirty={isDirty}
        isLoadingAction={isLoadingCreating}
        isShow={isShow}
        onCancel={handleCancel}
        onShow={handleShowCreate}
        onSubmitForm={handleSubmitForm}
        formErrors={formErrors}
        externalErrors={errors}
        suite={suite}
        colorType={colorType}
        parentSuiteOptions={{
          selectedParent,
          onClear: handleClearParent,
          onSelect: handleSelectParent,
        }}
      />
    )
  }
)

CreateSuite.displayName = "CreateSuite"

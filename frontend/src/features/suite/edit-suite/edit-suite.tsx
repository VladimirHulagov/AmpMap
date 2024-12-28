import { ReactNode, memo } from "react"

import { ActionFormSuite } from ".."
import { useSuiteEditModal } from "./use-suite-edit-modal"

interface Props {
  as?: ReactNode
  suite: Suite
  onSubmit?: (suite: SuiteResponseUpdate, oldSuite: Suite) => void
}

export const EditSuite = memo(({ as, suite, onSubmit }: Props) => {
  const {
    isShow,
    control,
    isLoadingUpdating,
    isDirty,
    errors,
    formErrors,
    selectedParent,
    handleClearParent,
    handleSelectParent,
    handleSubmitForm,
    handleCancel,
    handleShowEdit,
  } = useSuiteEditModal({ suite, onSubmit })

  return (
    <ActionFormSuite
      as={as}
      type="edit"
      control={control}
      isDirty={isDirty}
      isLoadingAction={isLoadingUpdating}
      isShow={isShow}
      onCancel={handleCancel}
      onShow={handleShowEdit}
      onSubmitForm={handleSubmitForm}
      formErrors={formErrors}
      externalErrors={errors}
      suite={suite}
      parentSuiteOptions={{
        selectedParent,
        onClear: handleClearParent,
        onSelect: handleSelectParent,
      }}
    />
  )
})

EditSuite.displayName = "EditSuite"

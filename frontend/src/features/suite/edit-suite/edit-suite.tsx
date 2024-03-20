import { ActionFormSuite } from ".."
import { useSuiteEditModal } from "./use-suite-edit-modal"

export const EditSuite = ({ suite }: { suite: Suite }) => {
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
  } = useSuiteEditModal(suite)

  return (
    <ActionFormSuite
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
}

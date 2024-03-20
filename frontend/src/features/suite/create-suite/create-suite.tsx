import { ActionFormSuite } from ".."
import { useSuiteCreateModal } from "./use-suite-create-modal"

export const CreateSuite = ({ suite }: { suite?: Suite }) => {
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
  } = useSuiteCreateModal(suite)

  return (
    <ActionFormSuite
      type="create"
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
      parentSuiteOptions={{
        selectedParent,
        onClear: handleClearParent,
        onSelect: handleSelectParent,
      }}
    />
  )
}

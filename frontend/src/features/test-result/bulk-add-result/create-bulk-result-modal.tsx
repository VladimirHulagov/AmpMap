import { Form, Modal } from "antd"
import { useTranslation } from "react-i18next"

import { useCreateBulkResultModal } from "features/test-result/bulk-add-result/use-create-bulk-result-modal"

import { Button, Step, Stepper } from "shared/ui"

import { AdditionalFieldsStepBody } from "./steps/additional-fields-step-body"
import { CommonFieldsStepBody } from "./steps/common-fields-step-body"
import { SpecificFieldsStepBody } from "./steps/specific-fields-step-body"
import { StatusStepBody } from "./steps/status-step-body"
import styles from "./styles.module.css"

interface Props {
  isShow: boolean
  onClose: () => void
  onSubmit: (formData: AddBulkResultFormData) => Promise<void>
  getBulkRequestData: () => TestBulkUpdate
  selectedCount: number
}

const TEST_ID = "create-bulk-result"

export const CreateBulkResultModal = ({
  isShow,
  onClose,
  onSubmit,
  selectedCount,
  getBulkRequestData,
}: Props) => {
  const { t } = useTranslation()
  const {
    control,
    currentStep,
    handleNext,
    handlePrev,
    handleSubmitForm,
    statuses,
    formErrors,
    commonFields,
    specificFields,
    project,
    isLoading,
    suiteSpecificFieldsData,
    register,
    isLoadingStatuses,
    isLoadingAttributes,
    isBulkApplying,
    bulkSuiteSpecific,
  } = useCreateBulkResultModal({ onSubmit, onClose, isShow, getBulkRequestData })

  const isFirstStep = currentStep === "status"
  const isLastStep = currentStep === "additional"

  return (
    <Modal
      bodyProps={{ "data-testid": `${TEST_ID}-modal-body` }}
      wrapProps={{ "data-testid": `${TEST_ID}-modal-wrapper` }}
      title={
        <div style={{ paddingLeft: 32 }}>
          <div className={styles.title}>{t("Add Results")}</div>
          <div className={styles.subTitle}>
            <span data-testid="create-modal-selected-tests-count" style={{ marginRight: 4 }}>
              {selectedCount}
            </span>
            <span>{t("Items")}</span>
          </div>
        </div>
      }
      open={isShow}
      onCancel={onClose}
      centered
      width={478}
      styles={{ content: { padding: "20px 0 16px 0", height: "100%" }, body: { minHeight: 489 } }}
      footer={[
        <div key="footer" className={styles.formFooter}>
          <Button
            id="cancel-create-bulk-result"
            onClick={onClose}
            loading={isLoading}
            color="secondary"
          >
            {t("Cancel")}
          </Button>
          {!isFirstStep && (
            <Button
              id="prev-step-button"
              onClick={handlePrev}
              loading={isLoading}
              color="secondary"
            >
              {t("Back")}
            </Button>
          )}
          {isLastStep ? (
            <Button
              id="submit-create-bulk-result"
              loading={isLoading}
              key="submit"
              onClick={handleSubmitForm}
              color="accent"
            >
              {t("Set")}
            </Button>
          ) : (
            <Button
              id="next-step-button"
              loading={isLoadingStatuses || isLoadingAttributes}
              key="submit"
              onClick={handleNext}
              color="accent"
            >
              {t("Next")}
            </Button>
          )}
        </div>,
      ]}
    >
      <Form
        id="create-bulk-result-form"
        layout="vertical"
        onFinish={handleSubmitForm}
        style={{ minHeight: "100%" }}
      >
        <Stepper activeStepId={currentStep}>
          <Step title={t("Select Status")} id="status" key="status">
            <StatusStepBody
              control={control}
              statuses={statuses}
              error={formErrors.status?.message}
              isLoading={isLoadingStatuses}
            />
          </Step>
          <Step title={t("Common Fields")} id="common" key="common">
            <CommonFieldsStepBody
              fields={commonFields}
              control={control}
              errors={
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                formErrors?.non_suite_specific?.map(({ value: { message } }) => message) ?? []
              }
            />
          </Step>
          <Step title={t("Suites Fields")} id="specific" key="specific">
            <SpecificFieldsStepBody
              isBulkApplying={isBulkApplying}
              control={control}
              fields={specificFields}
              bulkSpecificFields={bulkSuiteSpecific}
              errors={
                formErrors?.[isBulkApplying ? "bulk_suite_specific" : "suite_specific"]?.map?.(
                  // @ts-ignore
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                  ({ value: { message } }) => message
                ) ?? []
              }
              suites={suiteSpecificFieldsData.map(({ suite_id, suite_name, values }) => ({
                id: suite_id,
                name: suite_name,
                fieldsCount: values.length,
              }))}
            />
          </Step>
          <Step title={t("Additional Fields")} id="additional" key="additional">
            <AdditionalFieldsStepBody
              control={control}
              name="comment"
              formErrors={formErrors}
              register={register}
              projectId={project.id}
            />
          </Step>
        </Stepper>
      </Form>
    </Modal>
  )
}

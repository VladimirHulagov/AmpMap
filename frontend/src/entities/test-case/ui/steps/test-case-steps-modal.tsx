import { Button, Form, Input, Modal, Upload } from "antd"
import { Controller } from "react-hook-form"

import {
  TestCaseStepsModalProps,
  useTestCaseStepsModal,
} from "entities/test-case/model/use-test-case-steps-modal"

import { Attachment, TextArea } from "shared/ui"

export const TestCaseStepsModal = ({
  step,
  isEdit,
  onSubmit,
  onCloseModal,
}: TestCaseStepsModalProps) => {
  const {
    isLoading,
    isDirty,
    errors,
    control,
    attachments,
    attachmentsIds,
    handleClose,
    handleSubmit,
    onSubmitForm,
    onLoad,
    setAttachments,
    setValue,
    onChange,
    register,
    onRemove,
  } = useTestCaseStepsModal({ step, isEdit, onSubmit, onCloseModal })

  return (
    <Modal
      className="test-case-steps-modal"
      title={`${isEdit ? "Edit" : "Create"} step`}
      open={!!step}
      onCancel={handleClose}
      centered
      footer={[
        <Button id="modal-steps-cancel-btn" key="back" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          id={isEdit ? "modal-steps-edit-btn" : "modal-steps-create-btn"}
          key="submit"
          type="primary"
          onClick={handleSubmit(onSubmitForm)}
          loading={isLoading}
          disabled={!isDirty}
        >
          {isEdit ? "Update" : "Create"}
        </Button>,
      ]}
    >
      <Form id="test-case-steps-form" layout="vertical" onFinish={handleSubmit(onSubmitForm)}>
        <Form.Item
          label="Name"
          validateStatus={errors?.name ? "error" : ""}
          help={errors?.name ?? ""}
        >
          <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item
          label="Scenario"
          validateStatus={errors?.scenario ? "error" : ""}
          help={errors?.scenario ?? ""}
        >
          <Controller
            name="scenario"
            control={control}
            render={({ field }) => (
              <TextArea
                uploadId="step-scenario"
                fieldProps={field}
                stateAttachments={{ attachments, setAttachments }}
                customRequest={onLoad}
                setValue={setValue}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label="Expected"
          validateStatus={errors?.expected ? "error" : ""}
          help={errors?.expected ?? ""}
        >
          <Controller
            name="expected"
            control={control}
            render={({ field }) => (
              <TextArea
                uploadId="step-expected"
                fieldProps={field}
                stateAttachments={{ attachments, setAttachments }}
                customRequest={onLoad}
                setValue={setValue}
              />
            )}
          />
        </Form.Item>
        <Attachment.List handleAttachmentRemove={onRemove} attachments={attachments} />
        {attachmentsIds.map((field, index) => (
          <input type="hidden" key={field.id} {...register(`attachments.${index}`)} />
        ))}
        <Upload.Dragger
          name="file"
          multiple
          showUploadList={false}
          customRequest={onLoad}
          onChange={onChange}
          fileList={attachments}
          height={80}
        >
          <p className="ant-upload-text">Drop files here to attach, or click to browse.</p>
        </Upload.Dragger>
      </Form>
    </Modal>
  )
}

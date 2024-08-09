import { PlusOutlined } from "@ant-design/icons"
import { Button, Col, Divider, Form, Modal, Row, Select, Upload } from "antd"
import { Controller } from "react-hook-form"

import { statuses } from "shared/config"
import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError, Attachment, Attribute, Status, Steps, TextAreaWithAttach } from "shared/ui"

import { useEditCloneResultModal } from "./use-edit-clone-result-modal"

const { Dragger } = Upload

interface TestResultEditCopyModalProps {
  isShow: boolean
  setIsShow: React.Dispatch<React.SetStateAction<boolean>>
  testResult: IResult
  testCase: TestCase
  isClone: boolean
}

export const TestResultEditCloneModal = ({
  isShow,
  setIsShow,
  testResult,
  testCase,
  isClone,
}: TestResultEditCopyModalProps) => {
  const {
    isLoading,
    errors,
    attachments,
    attachmentsIds,
    control,
    attributes,
    stepsResult,
    isDirty,
    setAttachments,
    setStepsResult,
    handleAttachmentsLoad,
    setValue,
    handleCancel,
    handleSubmitForm,
    addAttribute,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeChangeName,
    onAttributeRemove,
    handleAttachmentsChange,
    handleAttachmentsRemove,
    register,
  } = useEditCloneResultModal({
    isShow,
    setIsShow,
    testResult,
    isClone,
  })

  return (
    <Modal
      className={`test-result-edit${isClone ? "-clone" : ""}-modal`}
      width={1200}
      centered
      open={isShow}
      onCancel={handleCancel}
      title={
        !isClone ? `Edit Test Result '${testResult.id}'` : `Clone Test Result '${testResult.id}'`
      }
      destroyOnClose
      footer={[
        <Button key="back" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          loading={isLoading}
          key="submit"
          type="primary"
          onClick={handleSubmitForm}
          disabled={!isDirty}
        >
          {!isClone ? "Update" : "Clone"}
        </Button>,
      ]}
    >
      {errors ? (
        <AlertError error={errors as ErrorObj} skipFields={["status", "comment", "attributes"]} />
      ) : null}

      <Form id="test-result-edit-form" layout="vertical" onFinish={handleSubmitForm}>
        <Row>
          <Col flex="1 0">
            <Form.Item
              label="Status"
              validateStatus={errors?.status ? "error" : ""}
              help={errors?.status ? errors.status : "Set the test status (passed, failed etc.)."}
            >
              <Controller
                name="status"
                control={control}
                render={({ field }) => {
                  return (
                    <Select {...field} placeholder="Please select" style={{ width: "100%" }}>
                      {statuses.map((status) => (
                        <Select.Option key={status.value} value={Number(status.value)}>
                          <Status value={status.label} />
                        </Select.Option>
                      ))}
                    </Select>
                  )
                }}
              />
            </Form.Item>

            <Form.Item
              label="Comment"
              validateStatus={errors?.comment ? "error" : ""}
              help={errors?.comment ? errors.comment : ""}
            >
              <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                  <TextAreaWithAttach
                    fieldProps={field}
                    stateAttachments={{ attachments, setAttachments }}
                    customRequest={handleAttachmentsLoad}
                    setValue={setValue}
                  />
                )}
              />
            </Form.Item>

            {attachmentsIds.map((field, index) => (
              <input type="hidden" key={field.id} {...register(`attachments.${index}`)} />
            ))}

            <Attachment.List
              handleAttachmentRemove={handleAttachmentsRemove}
              attachments={attachments}
            />

            <div>
              <Dragger
                name="file"
                multiple
                showUploadList={false}
                customRequest={handleAttachmentsLoad}
                onChange={handleAttachmentsChange}
                fileList={attachments}
              >
                <p className="ant-upload-text">Drop files here to attach, or click to browse.</p>
              </Dragger>
            </div>
          </Col>
          <Col>
            <Divider type="vertical" style={{ height: "100%" }} />
          </Col>
          <Col flex="1 0">
            {!!testCase.steps.length && (
              <Row style={{ flexDirection: "column", marginTop: 0 }}>
                <div className="ant-col ant-form-item-label">
                  <label title="Steps">Steps</label>
                </div>
                <Steps.ResultInEditModal
                  stepResultsData={testResult.steps_results}
                  stepResults={stepsResult}
                  setStepsResult={setStepsResult}
                />
              </Row>
            )}
            <Controller
              name="attributes"
              control={control}
              render={({ field }) => (
                <Row style={{ flexDirection: "column", marginTop: testCase.steps.length ? 24 : 0 }}>
                  <div className="ant-col ant-form-item-label">
                    <label title="Attributes">Attributes</label>
                  </div>
                  <Attribute.List
                    fieldProps={field}
                    attributes={attributes}
                    handleAttributeRemove={onAttributeRemove}
                    handleAttributeChangeName={onAttributeChangeName}
                    handleAttributeChangeValue={onAttributeChangeValue}
                    handleAttributeChangeType={onAttributeChangeType}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    errors={errors?.attributes ? JSON.parse(errors?.attributes) : undefined}
                  />

                  <div style={{ marginTop: 8 }}>
                    <Button type="dashed" block onClick={addAttribute}>
                      <PlusOutlined /> Add attribute
                    </Button>
                  </div>
                </Row>
              )}
            />
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

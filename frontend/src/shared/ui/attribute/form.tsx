import { Button, Col, Divider, Input, Radio, Row, Tooltip } from "antd"
import { ControllerRenderProps } from "react-hook-form"

import { FontsIcon, JsonIcon, ListIcon } from "shared/ui/icons"

const { TextArea } = Input

type FileType = "txt" | "list" | "json"

interface AttributFormProps {
  fieldProps: ControllerRenderProps<ResultFormData, "attributes">
  attribut: Attribute
  handleAttributeRemove: (attributeId: string) => void
  handleAttributeChangeName: (attributeId: string, name: string) => void
  handleAttributeChangeValue: (attributeId: string, value: string) => void
  handleAttributeChangeType: (attributeId: string, type: FileType) => void
}

export const AttributForm = ({
  fieldProps,
  attribut,
  handleAttributeRemove,
  handleAttributeChangeName,
  handleAttributeChangeValue,
  handleAttributeChangeType,
}: AttributFormProps) => {
  return (
    <>
      <div>
        <Row style={{ paddingBottom: 8 }}>
          <Col flex="auto">
            <Input
              value={attribut.name}
              onChange={(e) => handleAttributeChangeName(attribut.id, e.target.value)}
              onBlur={fieldProps.onBlur}
            />
          </Col>
          <Col flex="150px" style={{ textAlign: "right" }}>
            <Radio.Group
              value={attribut.type}
              onChange={(e) => handleAttributeChangeType(attribut.id, e.target.value as FileType)}
            >
              <Tooltip placement="topRight" title="Text value">
                <Radio.Button value="txt">
                  <FontsIcon />
                </Radio.Button>
              </Tooltip>
              <Tooltip placement="topRight" title="List value">
                <Radio.Button value="list">
                  <ListIcon />
                </Radio.Button>
              </Tooltip>
              <Tooltip placement="topRight" title="Json value">
                <Radio.Button value="json">
                  <JsonIcon />
                </Radio.Button>
              </Tooltip>
            </Radio.Group>
          </Col>
        </Row>

        <TextArea
          rows={4}
          value={String(attribut.value)}
          onChange={(e) => handleAttributeChangeValue(attribut.id, e.target.value)}
          onBlur={fieldProps.onBlur}
        />
      </div>

      <div style={{ textAlign: "right" }}>
        <Button
          id="delete-attribute"
          style={{ padding: 0, fontSize: "12px", height: "20px" }}
          type="link"
          danger
          onClick={() => {
            handleAttributeRemove(attribut.id)
          }}
        >
          Delete attribute
        </Button>
      </div>

      <Divider type={"horizontal"} style={{ width: "100%", margin: "0 0 8px 0" }} dashed />
    </>
  )
}

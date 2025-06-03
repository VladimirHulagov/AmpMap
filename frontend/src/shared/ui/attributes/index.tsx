import { Collapse, Typography } from "antd"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { Markdown } from "shared/ui"

export const AttributesObjectView = ({ attributes }: { attributes: AttributesObject }) => {
  const renderAttributeValue = (value: string | string[] | object) => {
    if (typeof value === "string") {
      return <Markdown content={value} pStyles={{ margin: 0 }} />
    } else if (Array.isArray(value)) {
      return <Markdown content={value.join("\r\n")} pStyles={{ margin: 0 }} />
    } else {
      return JSON.stringify(value, null, 2)
    }
  }

  return (
    <>
      {Object.keys(attributes ?? {}).map((keyName: string) => (
        <Collapse
          ghost
          style={{ padding: 0, margin: 0, userSelect: "none" }}
          key={`${keyName}-collapse`}
          expandIcon={({ isActive }) => (
            <ArrowIcon
              width={16}
              height={16}
              style={{
                color: "var(--y-color-secondary-inline)",
                transform: isActive ? "rotate(0deg)" : "rotate(-90deg)",
              }}
              data-testid={`collapse-result-attribute-${keyName}`}
            />
          )}
        >
          <Collapse.Panel
            key={keyName}
            className="collapse-wrapper"
            header={
              <span id="attribute-name" style={{ fontWeight: 600 }}>
                {keyName}
              </span>
            }
          >
            <Typography.Text
              style={{ whiteSpace: "pre-wrap", marginTop: 4, marginLeft: 4, display: "block" }}
              id={`attribute-${keyName}-content`}
            >
              {renderAttributeValue(attributes[keyName])}
            </Typography.Text>
          </Collapse.Panel>
        </Collapse>
      ))}
    </>
  )
}

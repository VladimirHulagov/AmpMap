import { Divider, Typography } from "antd"

type Attribute = {
  [key: string]: string | object | string[]
}

export const TestResultAttributes = ({ attributes }: { attributes: Attribute }) => {
  const renderAttributeValue = (value: string | string[] | object) => {
    if (typeof value === "string") {
      return value
    } else if (Array.isArray(value)) {
      return value.join("\r\n")
    } else {
      return JSON.stringify(value, null, 2)
    }
  }

  return (
    <>
      {Object.keys(attributes).map((keyName: string) => {
        return (
          <div key={keyName}>
            <Divider orientation="left" style={{ margin: 0, fontSize: 14 }}>
              <span id="attribute-name">{keyName}</span>
            </Divider>
            <div style={{ padding: 8 }}>
              <Typography>
                <Typography.Paragraph>
                  <Typography.Text style={{ whiteSpace: "pre-wrap" }} id="attribute-desc">
                    {renderAttributeValue(attributes[keyName])}
                  </Typography.Text>
                </Typography.Paragraph>
              </Typography>
            </div>
          </div>
        )
      })}
    </>
  )
}

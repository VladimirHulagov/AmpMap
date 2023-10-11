import { Divider, Typography } from "antd"

import { Markdown } from "shared/ui"

interface IFieldProps {
  id?: string
  title: string
  value: string | number | JSX.Element
  markdown?: boolean
}

export const Field = ({ id, title, value, markdown = false }: IFieldProps) => {
  if (value) {
    return (
      <>
        <Divider orientation="left" style={{ margin: 0 }} orientationMargin={0}>
          {title}
        </Divider>
        {markdown ? (
          <div className="content markdown" id={id}>
            <Markdown content={value as string} />
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            <Typography>
              <Typography.Paragraph id={id}>
                <Typography.Text style={{ whiteSpace: "pre-wrap" }}>{value}</Typography.Text>
              </Typography.Paragraph>
            </Typography>
          </div>
        )}
      </>
    )
  }

  return null
}

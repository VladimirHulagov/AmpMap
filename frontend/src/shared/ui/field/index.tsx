import { Divider, Typography } from "antd"

import { Markdown } from "shared/ui"

interface IFieldProps {
  id?: string
  dataTestId?: string
  title: string
  value: string | number | JSX.Element
  markdown?: boolean
  showLine?: boolean
  textStyles?: React.CSSProperties
  titleStyles?: React.CSSProperties
}

export const Field = ({
  id,
  dataTestId,
  title,
  value,
  markdown = false,
  showLine = true,
  textStyles = {},
  titleStyles = { fontSize: 16, fontWeight: 500 },
}: IFieldProps) => {
  if (!value) {
    return
  }

  return (
    <div>
      {showLine ? (
        <Divider orientation="left" style={{ marginTop: 0, ...titleStyles }} orientationMargin={0}>
          {title}
        </Divider>
      ) : (
        <div style={titleStyles}>{title}</div>
      )}

      {markdown ? (
        <div className="markdown" id={id} data-testid={dataTestId} style={textStyles}>
          <Markdown content={value as string} />
        </div>
      ) : (
        <Typography>
          <Typography.Paragraph id={id}>
            <Typography.Text
              style={{ whiteSpace: "pre-wrap", ...textStyles }}
              data-testid={dataTestId}
            >
              {value}
            </Typography.Text>
          </Typography.Paragraph>
        </Typography>
      )}
    </div>
  )
}

import { CSSProperties } from "react"

import { Markdown } from ".."

interface Props {
  textAreaHeight: number | null
  tab: "md" | "view"
  value: string
  style?: CSSProperties
}

export const MarkdownViewer = ({ tab, textAreaHeight, value, style }: Props) => {
  return (
    <div
      className="mdViewer"
      style={{
        display: tab === "view" ? "block" : "none",
        minHeight: textAreaHeight ? textAreaHeight + 1 : "auto",
        ...style,
      }}
    >
      <Markdown content={value} />
    </div>
  )
}

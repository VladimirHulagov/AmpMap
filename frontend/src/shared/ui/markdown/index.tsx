import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { MarkdownCheckbox } from "./markdown-checkbox/markdown-checkbox"
import { MarkdownCodeBlock } from "./markdown-code-block/markdown-code-block"
import "./styles.css"

interface MarkdownProps extends HTMLDataAttribute {
  content: string
  pStyles?: React.CSSProperties
}

export const Markdown = ({ content, pStyles = {}, ...props }: MarkdownProps) => {
  return (
    <ReactMarkdown
      children={content}
      linkTarget="_blank"
      components={{
        img: ({ ...propsImg }) => (
          <a href={propsImg.src} target="blank">
            <img {...propsImg} />
          </a>
        ),
        code: MarkdownCodeBlock,
        p: ({ children }) => {
          return <p style={{ whiteSpace: "pre-wrap", ...pStyles }}>{children}</p>
        },
        input: ({ type, ...inputProps }) => {
          if (type === "checkbox") {
            return <MarkdownCheckbox {...inputProps} />
          }
          return <input type={type} {...inputProps} />
        },
      }}
      remarkPlugins={[remarkGfm]}
      {...props}
    />
  )
}

import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"

import "./styles.css"

interface MarkdownProps {
  content: string
}

export const Markdown = ({ content }: MarkdownProps) => {
  return (
    <ReactMarkdown
      children={content}
      components={{
        img: ({ ...props }) => (
          <a href={props.src} target="blank">
            <img {...props} />
          </a>
        ),
        code({ inline, className = "", children, ...props }) {
          const match = /language-(\w+)/.exec(className)
          return !inline && match ? (
            <SyntaxHighlighter
              {...props}
              children={String(children).replace(/\n$/, "")}
              style={oneLight}
              language={match[1]}
              PreTag="div"
            />
          ) : (
            <code {...props} className={className}>
              {children}
            </code>
          )
        },
      }}
      remarkPlugins={[remarkGfm]}
    />
  )
}

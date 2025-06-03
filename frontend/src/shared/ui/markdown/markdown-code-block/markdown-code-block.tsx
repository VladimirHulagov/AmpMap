import { CopyOutlined } from "@ant-design/icons"
import { message } from "antd"
import classNames from "classnames"
import { useTranslation } from "react-i18next"
import { CodeComponent } from "react-markdown/lib/ast-to-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"

import { useAppSelector } from "app/hooks"

import { selectThemeValue } from "entities/system/model/slice-theme"

import { Button } from "../../button"
import styles from "./styles.module.css"

export const MarkdownCodeBlock: CodeComponent = ({ className = "", children, ...propsCode }) => {
  const { t } = useTranslation()
  const themeValue = useAppSelector(selectThemeValue)
  const findLanguage = /language-(\w+)/.exec(className) ?? ["text"]

  return (
    <div className={styles.codeBlockWrapper} data-testid="markdown-code-block">
      <div
        className={classNames(styles.codeBlockHeader, {
          [styles.darkHeader]: themeValue === "dark",
          [styles.lightHeader]: themeValue === "light",
        })}
      >
        <span className={styles.codeBlockLanguage}>{findLanguage?.[1]}</span>
        <span className={styles.codeBlockCopyBtn}>
          <Button
            color="ghost"
            size="s"
            onClick={() => {
              navigator.clipboard.writeText(children as string)
              message.info(t("Code copied to clipboard"))
            }}
          >
            <CopyOutlined style={{ fontSize: 14 }} />
            {t("Copy")}
          </Button>
        </span>
      </div>
      <SyntaxHighlighter
        {...propsCode}
        children={String(children).replace(/\n$/, "")}
        style={themeValue === "dark" ? oneDark : oneLight}
        language={findLanguage[1]}
        className={styles.codeBlock}
        PreTag="div"
      />
    </div>
  )
}

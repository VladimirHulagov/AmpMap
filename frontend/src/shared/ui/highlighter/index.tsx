import Highlighter from "react-highlight-words"

import { colors } from "shared/config"

interface HighLighterTestyProps {
  searchWords: string
  textToHighlight: string
  backgroundColor?: string
  color?: string
  id?: string
}

export const HighLighterTesty = ({
  searchWords,
  textToHighlight,
  backgroundColor = "var(--y-grey-20)",
  color = colors.accent,
  id,
}: HighLighterTestyProps) => {
  return (
    <Highlighter
      autoEscape
      highlightStyle={{
        backgroundColor,
        color,
        padding: 0,
      }}
      searchWords={[searchWords]}
      textToHighlight={textToHighlight ?? ""}
      data-testid={id}
    />
  )
}

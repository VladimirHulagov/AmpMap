import { Divider } from "antd"

import { Markdown } from "shared/ui"

export const TestResultComment = ({ result }: { result: IResult }) => {
  return (
    <>
      <Divider orientation="left" style={{ margin: 0, fontSize: 14 }}>
        Comment
      </Divider>
      <div className="content markdown" id="test-result-comment">
        <Markdown content={result.comment ? result.comment : "No Comment"} />
      </div>
    </>
  )
}

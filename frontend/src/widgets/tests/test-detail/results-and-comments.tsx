import { Typography } from "antd"
import { selectOpenedComments } from "entities/comments/model/slice"
import { useTranslation } from "react-i18next"

import { useAppSelector } from "app/hooks"

import { selectUser } from "entities/auth/model"

import { selectOpenedResults } from "entities/result/model/slice"
import { Result } from "entities/result/ui/result/result"

import { ContainerLoader } from "shared/ui"

import { Comment } from "../../comments"

interface Props {
  entities: (Result | CommentType)[]
  testId: number
  testCase: TestCase
  isProjectArchive: boolean
  onActionClick: (result: Result, isClone: boolean) => void
  isFetching?: boolean
  model: Models
  object_id: string
  ordering: Ordering
}

export const ResultsAndComments = ({ isFetching, entities, ...props }: Props) => {
  const user = useAppSelector(selectUser)
  const openedResults = useAppSelector(selectOpenedResults)
  const openedComments = useAppSelector(selectOpenedComments)

  const { t } = useTranslation()

  if (isFetching) return <ContainerLoader />

  if (entities.length === 0) {
    return (
      <div style={{ padding: 8 }} id="test-result">
        <Typography>
          <Typography.Paragraph>
            <Typography.Text style={{ whiteSpace: "pre-wrap" }}>
              {t("No test results and comments")}
            </Typography.Text>
          </Typography.Paragraph>
        </Typography>
      </div>
    )
  }

  return (
    <div style={{ margin: "12px 0" }} id="test-result">
      {entities.map((entity, index) => {
        if ("status" in entity) {
          const shouldOpenResult = !openedResults.includes(entity.id) && index === 0

          return (
            <Result
              result={entity}
              key={`${entity.id}-result`}
              testCase={props.testCase}
              testId={props.testId}
              isProjectArchive={props.isProjectArchive}
              isOpen={openedResults?.includes(entity.id) || shouldOpenResult}
              onActionClick={props.onActionClick}
            />
          )
        }

        const shouldOpenComment = !openedComments.includes(entity.id) && index === 0

        const isVisibleActions =
          Number(entity.user.id) === Number(user?.id) && entity.deleted_at === null

        return (
          <Comment
            key={`${entity.id}-comment`}
            comment={entity}
            isVisibleActions={isVisibleActions}
            label={<span style={{ marginRight: 8 }}>{t("Comment")}</span>}
            isOpen={openedComments?.includes(entity.id) || shouldOpenComment}
          />
        )
      })}
    </div>
  )
}

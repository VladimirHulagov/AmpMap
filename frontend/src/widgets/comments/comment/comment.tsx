import { Collapse, Flex } from "antd"
import classNames from "classnames"
import { toggleCommentVisibility } from "entities/comments/model/slice"
import { ReactNode, useEffect } from "react"
import { useLocation } from "react-router-dom"

import { useAppDispatch } from "app/hooks"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { AttachmentField, Markdown } from "shared/ui"

import { CommentHeader } from "./comment-header"
import styles from "./styles.module.css"

interface Props {
  comment: CommentType
  isVisibleActions: boolean
  label?: ReactNode
  isOpen?: boolean
}

export const Comment = ({ comment, isVisibleActions, label, isOpen }: Props) => {
  const location = useLocation()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (location.hash && location.hash.includes("comment")) {
      const element = document.getElementById(location.hash.substring(1))
      element?.scrollIntoView({ behavior: "smooth" })
    }
  }, [location])

  return (
    <li
      id={`comment-${comment.id}`}
      className={classNames(styles.wrapper, {
        [styles.hashActive]: location.hash === `#comment-${comment.id}`,
      })}
    >
      <Collapse
        ghost
        style={{ padding: 0, margin: 0 }}
        defaultActiveKey={isOpen ? comment.id : undefined}
        expandIcon={({ isActive }) => (
          <ArrowIcon
            width={24}
            height={24}
            className={classNames(styles.arrowIcon, {
              [styles.arrowIconOpen]: isActive,
            })}
            onClick={() => dispatch(toggleCommentVisibility(comment.id))}
            data-testid={`collapse-comment-${comment.id}`}
          />
        )}
      >
        <Collapse.Panel
          header={
            <Flex align="center">
              {label}
              <CommentHeader comment={comment} isVisibleActions={isVisibleActions} />
            </Flex>
          }
          key={comment.id}
        >
          <div className={styles.commentBody}>
            {comment.deleted_at === null ? (
              <div data-testid={`comment-${comment.id}-content`}>
                <Markdown content={comment.content} pStyles={{ margin: 0 }} />
              </div>
            ) : (
              <span
                style={{ fontStyle: "italic" }}
                data-testid={`comment-${comment.id}-content-deleted`}
              >
                {comment.content}
              </span>
            )}
          </div>

          <div style={{ paddingLeft: 28 }}>
            <AttachmentField
              attachments={comment.attachments}
              isDivider={false}
              showTitle={false}
            />
          </div>
        </Collapse.Panel>
      </Collapse>
    </li>
  )
}

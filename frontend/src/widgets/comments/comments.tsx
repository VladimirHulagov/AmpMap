import { WechatOutlined } from "@ant-design/icons"
import { Button, Pagination } from "antd"
import { useGetCommentsQuery } from "entities/comments/api"
import { AddComment } from "features/comments"
import { useEffect, useRef, useState } from "react"

import { ContainerLoader } from "shared/ui"

import { CommentList } from "./comment-list"
import styles from "./styles.module.css"

interface Props {
  model: Models
  object_id: string
  ordering: "asc" | "desc"
}

export const Comments = ({ model, object_id, ordering }: Props) => {
  const [isShowAdd, setIsShowAdd] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 5,
  })
  const { data, isLoading } = useGetCommentsQuery({
    model,
    object_id,
    page: pagination.page,
    page_size: pagination.page_size,
    ordering: ordering === "asc" ? "created_at" : "-created_at",
  })

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ page, page_size: pageSize })
  }

  const handleAddCommentClick = () => {
    setIsShowAdd(true)
  }

  useEffect(() => {
    if (!isShowAdd) return

    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [isShowAdd])

  if (isLoading || !data) {
    return <ContainerLoader />
  }

  return (
    <>
      <CommentList comments={data.results} />
      <div className={styles.footer}>
        {!isShowAdd && (
          <Button
            id="add-comment-btn"
            className={styles.btn}
            onClick={handleAddCommentClick}
            icon={<WechatOutlined />}
          >
            Add comment
          </Button>
        )}
        <Pagination
          defaultCurrent={1}
          pageSize={pagination.page_size}
          size="small"
          total={data.count}
          style={{ width: "fit-content", marginLeft: "auto" }}
          onChange={handlePaginationChange}
        />
      </div>
      {isShowAdd && <AddComment model={model} object_id={object_id} setIsShowAdd={setIsShowAdd} />}
      <div ref={bottomRef} />
    </>
  )
}

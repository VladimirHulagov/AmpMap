import { WechatOutlined } from "@ant-design/icons"
import { Button, Pagination } from "antd"
import { useLazyGetCommentsQuery } from "entities/comments/api"
import { AddComment } from "features/comments"
import { useEffect, useRef, useState } from "react"

import { ContainerLoader } from "shared/ui"

import { CommentList } from ".."
import styles from "./styles.module.css"

interface Props {
  model: Models
  object_id: string
  ordering: Ordering
  onUpdateCommentsCount?: (count: number) => void
}

export const Comments = ({ model, object_id, ordering, onUpdateCommentsCount }: Props) => {
  const [isShowAdd, setIsShowAdd] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const orderingRequest = ordering === "asc" ? "created_at" : "-created_at"
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 5,
  })
  const comment_id = window.location.hash.split("#comment-")[1]
  const [dataComments, setDataComments] = useState<PaginationResponse<CommentType[]> | null>(null)
  const [getComments, { data, isLoading }] = useLazyGetCommentsQuery()

  useEffect(() => {
    // first request need be without page parameter
    getComments({
      comment_id,
      model,
      object_id,
      page_size: pagination.page_size,
      ordering: orderingRequest,
    })
  }, [comment_id, orderingRequest])

  useEffect(() => {
    if (data && onUpdateCommentsCount) {
      onUpdateCommentsCount(data.count)
    }
  }, [data])

  const handlePaginationChange = (page: number, page_size: number) => {
    setPagination({ page, page_size })
    getComments({
      comment_id,
      model,
      object_id,
      page: page,
      page_size,
      ordering: orderingRequest,
    })
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

  useEffect(() => {
    if (!data) return
    setDataComments(data)
  }, [data])

  useEffect(() => {
    if (!data) return
    if (data.pages.current !== pagination.page) {
      setPagination({ ...pagination, page: data.pages.current })
    }
  }, [data, pagination, comment_id])

  if (isLoading || !dataComments) {
    return <ContainerLoader />
  }

  return (
    <>
      <CommentList comments={dataComments.results} />
      <div className={styles.footer}>
        {!isShowAdd && (
          <Button id="add-comment-btn" onClick={handleAddCommentClick} icon={<WechatOutlined />}>
            Add comment
          </Button>
        )}
        <Pagination
          defaultCurrent={1}
          current={pagination.page}
          pageSize={pagination.page_size}
          size="small"
          total={dataComments.count}
          style={{ width: "fit-content", marginLeft: "auto" }}
          onChange={handlePaginationChange}
        />
      </div>
      {isShowAdd && <AddComment model={model} object_id={object_id} setIsShowAdd={setIsShowAdd} />}
      <div ref={bottomRef} />
    </>
  )
}

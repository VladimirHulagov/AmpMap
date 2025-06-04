import { Flex, Progress, Spin } from "antd"
import classNames from "classnames"
import { useMeContext } from "processes"
import { Link } from "react-router-dom"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { LazyNodeProps, LazyTreeNodeApi } from "shared/libs/tree"
import { ArchivedTag, TreeTableLoadMore } from "shared/ui"

import styles from "./styles.module.css"

const getLink = (
  node: LazyTreeNodeApi<Test | TestPlan, LazyNodeProps>,
  projectId: number,
  userId?: number
) => {
  const queryParams = new URLSearchParams(location.search)
  return `/projects/${projectId}/plans/${node.id}?${queryParams.toString()}&assignee=${userId}`
}

interface Props {
  node: LazyTreeNodeApi<Test | TestPlan, LazyNodeProps>
  projectId: number
  testPlanId?: number | null
}

export const TestPlanTreeOverviewNodeView = ({ node, projectId }: Props) => {
  const data = node.data as TestPlan
  const offset = node.props.level * 20 + 8
  const { me } = useMeContext()
  const link = getLink(node, projectId, me?.id)

  const handleMoreClick = async () => {
    await node.more()
  }

  if (node.props.isLeaf) {
    return null
  }

  const testsProgressTotal = data.tests_progress_total ?? 0
  const totalTests = data.total_tests ?? 0
  const progressPercent = totalTests > 0 ? Math.round((testsProgressTotal / totalTests) * 100) : 0

  return (
    <>
      <tr id={`${node.title}-${node.id}`} className={styles.tr}>
        <td className={styles.containerItem}>
          <span style={{ width: offset, height: 1, float: "left" }} />
          <div className={styles.nodeLeftAction}>
            {data.is_archive && <ArchivedTag />}
            {node.props.isLoading && <Spin size="small" className={styles.loader} />}
            {!node.props.isLoading && node.props.canOpen && (
              <ArrowIcon
                width={24}
                height={24}
                className={classNames(styles.arrowIcon, {
                  [styles.arrowIconOpen]: node.props.isOpen,
                })}
                onClick={(e) => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  e.stopPropagation()
                  node.open()
                }}
              />
            )}
          </div>
          <Link
            to={link}
            className={styles.name}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {node.data.title}
          </Link>
        </td>
        <td className={styles.containerItem} style={{ width: 150 }}>
          <Flex vertical style={{ width: "100%" }}>
            <Flex justify="space-between">
              <span>
                {testsProgressTotal} / {totalTests}
              </span>
              <span>{progressPercent}%</span>
            </Flex>
            <Progress
              percent={progressPercent}
              status={progressPercent === 100 ? "success" : "normal"}
              showInfo={false}
            />
          </Flex>
        </td>
      </tr>
      {node.parent?.props.hasMore && node.isLast && (
        <TreeTableLoadMore
          isLoading={node.props.isMoreLoading}
          node={node}
          onMore={handleMoreClick}
          isLast={node.isLast}
          isRoot
          offset={offset}
        />
      )}
    </>
  )
}

import { Flex, Input, Popover, Tooltip } from "antd"
import { useMeContext } from "processes"
import { makeNode } from "processes/treebar-provider/utils"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  useLazyGetTestPlanAncestorsQuery,
  useLazyGetTestPlanAssigneeProgressQuery,
} from "entities/test-plan/api"
import { TestPlanTreeOverviewNodeView } from "entities/test-plan/ui"

import { useProjectContext } from "pages/project"

import SorterIcon from "shared/assets/yi-icons/sort.svg?react"
import { config } from "shared/config"
import { useDebounce } from "shared/hooks"
import {
  LazyNodeProps,
  LazyTreeNodeApi,
  LazyTreeView,
  NodeId,
  TreeNodeFetcher,
} from "shared/libs/tree"
import { Button, SortBy, TreeTable, TreeTableLoadMore } from "shared/ui"

const TEST_ID = "assigned-to-me-stats"

export const ProjectAssignedToMeOverviewTree = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { me } = useMeContext()
  const [searchText, setSearchText] = useState("")
  const [ordering, setOrdering] = useState("name")
  const searchDebounce = useDebounce(searchText, 250, true)
  const [getAssigneeProgress] = useLazyGetTestPlanAssigneeProgressQuery()
  const [getAncestors] = useLazyGetTestPlanAncestorsQuery()

  const SORTER_OPTIONS = [
    { value: "name", label: t("Name") },
    { value: "started_at", label: t("Start Date") },
    { value: "created_at", label: t("Created At") },
  ]

  const fetcher: TreeNodeFetcher<Test | TestPlan, LazyNodeProps> = useCallback(
    async (params) => {
      const res = await getAssigneeProgress(
        {
          project: project.id,
          page: params.page,
          parent: params.parent ? Number(params.parent) : null,
          page_size: config.defaultTreePageSize,
          assignee: me?.id ? me.id : undefined,
          treesearch: searchDebounce,
          ordering,
          _n: params._n,
        },
        false
      ).unwrap()

      const data = makeNode<Test | TestPlan>(res.results, params, (item) => ({
        isOpen: false,
        isLeaf: item.is_leaf,
      }))
      return { data, nextInfo: res.pages, _n: params._n }
    },
    [searchDebounce, ordering]
  )

  const fetcherAncestors = (id: NodeId) => {
    return getAncestors({ project: project.id, id: Number(id) }).unwrap()
  }

  return (
    <div style={{ width: "100%", marginTop: 24 }}>
      <Flex justify="space-between" gap={16} style={{ marginBottom: 24 }}>
        <Input
          placeholder={t("Search")}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          data-testid={`${TEST_ID}-search-input`}
        />
        <Tooltip title={t("Sort")}>
          <Popover
            content={
              <SortBy
                options={SORTER_OPTIONS}
                onChange={setOrdering}
                defaultValue={SORTER_OPTIONS[0].value}
                value={ordering}
                data-testid={`${TEST_ID}-sorter-sort-by-group`}
              />
            }
            arrow={false}
            trigger="click"
            placement="bottomLeft"
          >
            <Button
              style={{ minWidth: 32 }}
              icon={<SorterIcon color="var(--y-color-secondary-inline)" width={18} height={18} />}
              data-testid={`${TEST_ID}-sorter-button`}
              color="secondary-linear"
              shape="square"
            />
          </Popover>
        </Tooltip>
      </Flex>
      <TreeTable visibleColumns={[]} hasAddResult={false} bordered={false}>
        <LazyTreeView
          fetcher={fetcher}
          fetcherAncestors={fetcherAncestors}
          rootId={null}
          cacheKey={`${TEST_ID}-${project.id}`}
          initDependencies={[searchDebounce, ordering]}
          renderNode={(node) => (
            <TestPlanTreeOverviewNodeView
              node={node as LazyTreeNodeApi<Test | TestPlan, LazyNodeProps>} // FIX IT cast type
              projectId={project.id}
            />
          )}
          renderLoadMore={({ isLoading, onMore }) => (
            <TreeTableLoadMore isLast isRoot isLoading={isLoading} onMore={onMore} />
          )}
        />
      </TreeTable>
    </div>
  )
}

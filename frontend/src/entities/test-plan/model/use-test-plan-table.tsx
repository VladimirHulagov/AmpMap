import { Tag } from "antd"
import { TablePaginationConfig } from "antd/es/table"
import { ColumnsType } from "antd/lib/table"
import { SorterResult } from "antd/lib/table/interface"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useGetTestPlansTreeViewQuery } from "entities/test-plan/api"

import { useUserConfig } from "entities/user/model"

import { colors } from "shared/config"
import { TreeUtils } from "shared/libs"
import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"
import { HighLighterTesty } from "shared/ui"

export const useTestPlanTable = () => {
  const navigate = useNavigate()
  const { userConfig, updateConfig } = useUserConfig()
  const { projectId, testPlanId } = useParams<ParamProjectId & ParamTestPlanId>()
  const [searchText, setSearchText] = useState("")
  const [ordering, setOrdering] = useState<string | undefined>(undefined)

  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([])
  const [paginationParams, setPaginationParams] = useState({
    page: 1,
    pageSize: 10,
  })

  const { data: treeTestPlans, isLoading } = useGetTestPlansTreeViewQuery({
    projectId,
    parent: testPlanId,
    showArchive: userConfig.test_plans.is_show_archived,
    search: searchText,
    ordering,
    page: paginationParams.page,
    page_size: paginationParams.pageSize,
  })

  const onShowArchived = async () => {
    await updateConfig({
      test_plans: { is_show_archived: !userConfig.test_plans.is_show_archived },
    })
  }

  const columns: ColumnsType<ITestPlanTreeView> = [
    {
      title: "Test Plan",
      dataIndex: "title",
      key: "title",
      sorter: true,
      render: (text, record) => (
        <Link to={`/projects/${projectId}/plans/${record.id}`}>
          <HighLighterTesty searchWords={searchText} textToHighlight={text} />
        </Link>
      ),
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      width: "100px",
      filters: [
        {
          text: "Archived",
          value: true,
        },
      ],
      onFilter: (_, record) => record.is_archive,
      render: (_, record) => {
        return record.is_archive ? <Tag color={colors.error}>Archived</Tag> : null
      },
    },
  ]

  const onSearch = (treePlans: ITestPlanTreeView[], searchText: string) => {
    setPaginationParams({ page: 1, pageSize: 10 })
    setSearchText(searchText.trim())

    if (!searchText.trim().length) {
      setExpandedRowKeys([])
      return
    }

    const [, expandedRows] = TreeUtils.filterRows<ITestPlanTreeView>(
      JSON.parse(JSON.stringify(treePlans)),
      searchText,
      {
        isAllExpand: true,
        isShowChildren: false,
      }
    )

    setExpandedRowKeys(expandedRows as number[])
  }

  const onRowExpand = (expandedRows: number[], recordKey: number) => {
    if (expandedRows.includes(recordKey)) {
      setExpandedRowKeys(expandedRows.filter((key) => key !== recordKey))
    } else {
      setExpandedRowKeys([...expandedRows, recordKey])
    }
  }

  const handleRowClick = ({ id }: ITestPlanTreeView) => {
    navigate(`/projects/${projectId}/plans/${id}`)
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPaginationParams({ page, pageSize })
  }

  const handleSorter = (
    sorter: SorterResult<ITestPlanTreeView> | SorterResult<ITestPlanTreeView>[]
  ) => {
    const formatSort = antdSorterToTestySort(sorter, "plans")
    setOrdering(formatSort || undefined)
  }

  const paginationTable: TablePaginationConfig = {
    hideOnSinglePage: false,
    pageSizeOptions: ["10", "20", "50", "100"],
    showLessItems: true,
    showSizeChanger: true,
    current: paginationParams.page,
    pageSize: paginationParams.pageSize,
    total: treeTestPlans?.count || 0,
    onChange: handlePaginationChange,
  }

  return {
    onRowExpand,
    onSearch,
    handleSorter,
    onShowArchived,
    handleRowClick,
    columns,
    expandedRowKeys,
    isLoading,
    treeTestPlans,
    showArchive: userConfig.test_plans.is_show_archived,
    searchText,
    paginationTable,
  }
}

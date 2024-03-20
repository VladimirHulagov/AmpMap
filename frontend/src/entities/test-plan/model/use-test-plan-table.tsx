import { Tag } from "antd"
import { TablePaginationConfig } from "antd/es/table"
import { ColumnsType } from "antd/lib/table"
import { SorterResult } from "antd/lib/table/interface"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useGetTestPlansTreeViewQuery } from "entities/test-plan/api"

import { useUserConfig } from "entities/user/model"

import { colors } from "shared/config"
import { TreeUtils } from "shared/libs"
import { addKeyToData } from "shared/libs/add-key-to-data"
import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"
import { HighLighterTesty } from "shared/ui"

const defaultPaginationParams = {
  page: 1,
  pageSize: 10,
}

export const useTestPlanTable = () => {
  const navigate = useNavigate()
  const { userConfig, updateConfig } = useUserConfig()
  const { projectId: pid, testPlanId: tid } = useParams<ParamProjectId & ParamTestPlanId>()
  const [searchText, setSearchText] = useState("")
  const [ordering, setOrdering] = useState<string | undefined>(undefined)
  const [projectId, setProjectId] = useState<string | undefined>(pid)
  const [testPlanId, setTestPlanId] = useState<string | undefined>(tid)
  const [total, setTotal] = useState<number>(0)

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  const [paginationParams, setPaginationParams] = useState(defaultPaginationParams)
  const [treeData, setTreeData] = useState<TestPlanTreeView[]>([])

  useEffect(() => {
    setPaginationParams(defaultPaginationParams)
    setProjectId(pid)
    setSearchText("")
    setOrdering(undefined)
    setTestPlanId(tid)
  }, [pid, tid])

  const { data: testPlansTreeView, isLoading } = useGetTestPlansTreeViewQuery(
    {
      search: searchText,
      projectId,
      is_archive: userConfig.test_plans.is_show_archived,
      ordering,
      page: paginationParams.page,
      page_size: paginationParams.pageSize,
      parent: testPlanId,
    },
    {
      skip: !projectId,
    }
  )

  useEffect(() => {
    if (!testPlansTreeView) return

    setTreeData(testPlansTreeView.results)
    setTotal(testPlansTreeView.count)
  }, [testPlansTreeView])

  useEffect(() => {
    if (!testPlansTreeView || !searchText.length) return
    const initDataWithKeys = addKeyToData(testPlansTreeView.results)
    const [, expandedRows] = TreeUtils.filterRows<DataWithKey<TestPlanTreeView>>(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      JSON.parse(JSON.stringify(initDataWithKeys)),
      searchText,
      {
        isAllExpand: true,
        isShowChildren: false,
      }
    )

    setExpandedRowKeys(expandedRows.map((key) => String(key)))
  }, [testPlansTreeView, searchText])

  const onShowArchived = async () => {
    await updateConfig({
      test_plans: { is_show_archived: !userConfig.test_plans.is_show_archived },
    })
  }

  const columns: ColumnsType<TestPlanTreeView> = [
    {
      title: "Test Plan",
      dataIndex: "title",
      key: "title",
      sorter: true,
      render: (text, record) => (
        <Link id={record.name} to={`/projects/${projectId}/plans/${record.id}`}>
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment*/}
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

  const onSearch = (searchText: string) => {
    setPaginationParams({ page: 1, pageSize: 10 })
    setSearchText(searchText.trim())

    if (!searchText.trim().length) {
      setExpandedRowKeys([])
      return
    }
  }

  const onRowExpand = (expandedRows: string[], recordKey: string) => {
    if (expandedRows.includes(recordKey)) {
      setExpandedRowKeys(expandedRows.filter((key) => key !== recordKey))
    } else {
      setExpandedRowKeys([...expandedRows, recordKey])
    }
  }

  const handleRowClick = ({ id }: TestPlanTreeView) => {
    navigate(`/projects/${projectId}/plans/${id}`)
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPaginationParams({ page, pageSize })
  }

  const handleSorter = (
    sorter: SorterResult<TestPlanTreeView> | SorterResult<TestPlanTreeView>[]
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
    total,
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
    treeData,
    showArchive: userConfig.test_plans.is_show_archived,
    searchText,
    paginationTable,
  }
}

import { Tag } from "antd"
import { TablePaginationConfig } from "antd/es/table"
import { ColumnsType } from "antd/lib/table"
import { useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { useGetTestPlansTreeViewQuery } from "entities/test-plan/api"

import { useUserConfig } from "entities/user/model"

import { colors, config } from "shared/config"
import { useAntdTable } from "shared/hooks/use-antd-table"
import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"
import { HighLighterTesty } from "shared/ui"

interface UseTestPlanTableProps {
  setCollapse: React.Dispatch<React.SetStateAction<boolean>>
}

export const useTestPlanTable = ({ setCollapse }: UseTestPlanTableProps) => {
  const navigate = useNavigate()
  const { projectId, testPlanId } = useParams<ParamProjectId & ParamTestPlanId>()
  const { userConfig, updateConfig } = useUserConfig()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isShowArchive, setIsShowArchive] = useState<boolean>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    searchParams.get("show_archived")
      ? JSON.parse(searchParams.get("show_archived") ?? "")
      : userConfig.test_plans.is_show_archived
  )
  const {
    data,
    tableParams,
    total,
    isLoading,
    expandedRowKeys,
    searchText,
    handleChange,
    handleRowClick,
    handleRowExpand,
    handleSearch,
  } = useAntdTable<TestPlanTreeView>({
    // @ts-ignore
    getData: useGetTestPlansTreeViewQuery,
    onRowClick: ({ id }) => navigate(`/projects/${projectId}/plans/${id}`),
    requestParams: {
      project: projectId,
      parent: testPlanId,
      is_archive: isShowArchive,
    },
    requestOptions: {
      skip: !projectId,
    },
    sorter: (sorter) => antdSorterToTestySort(sorter, "plans"),
  })

  const onShowArchived = async () => {
    setIsShowArchive(!isShowArchive)
    await updateConfig({
      test_plans: { is_show_archived: !userConfig.test_plans.is_show_archived },
    })
    const urlParams = Object.fromEntries([...searchParams])
    setSearchParams({
      ...urlParams,
      show_archived: String(!userConfig.test_plans.is_show_archived),
    })
  }

  const onCollapseChange = (key: string | string[]) => {
    if (!Array.isArray(key)) return
    setCollapse((prevState) => !prevState)
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

  const paginationTable: TablePaginationConfig = {
    hideOnSinglePage: false,
    pageSizeOptions: config.pageSizeOptions,
    showLessItems: true,
    showSizeChanger: true,
    current: tableParams.page,
    pageSize: tableParams.page_size,
    total,
  }

  return {
    columns,
    expandedRowKeys,
    isLoading,
    treeData: data,
    showArchive: isShowArchive,
    searchText,
    paginationTable,
    onRowExpand: handleRowExpand,
    onSearch: handleSearch,
    onShowArchived,
    onCollapseChange,
    handleRowClick,
    handleChange,
  }
}

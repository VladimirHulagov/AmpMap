import { Tooltip, Typography } from "antd"
import { TableProps } from "antd/es/table"
import { ColumnsType, TablePaginationConfig } from "antd/lib/table"
import { FilterValue } from "antd/lib/table/interface"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { useGetProjectsQuery } from "entities/project/api"
import { ProjectIcon } from "entities/project/ui"

import { useTableSearch } from "shared/hooks"
import { HighLighterTesty } from "shared/ui"
import { CheckedIcon } from "shared/ui/icons"

const { Link } = Typography

export const useProjectsTable = () => {
  const navigate = useNavigate()
  const { setSearchText, getColumnSearch, searchText } = useTableSearch()
  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({})
  const [paginationParams, setPaginationParams] = useState({
    page: 1,
    pageSize: 10,
  })

  const { data: projects, isLoading } = useGetProjectsQuery({
    is_archive: filteredInfo?.is_archive ? (filteredInfo?.is_archive[0] as boolean) : undefined,
    page: paginationParams.page,
    page_size: paginationParams.pageSize,
    name: searchText || undefined,
  })

  const handleClearAll = () => {
    setFilteredInfo({})
    setSearchText("")
  }

  const handleShowProjectDetail = (projectId: Id) => {
    navigate(`/administration/projects/${projectId}/overview`)
  }

  const handleChange: TableProps<Project>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>
  ) => {
    setFilteredInfo(filters)
  }

  const handleRowClick = (record: Project) => {
    if (record.is_private && !record.is_manageable) {
      return
    }
    navigate(`/administration/projects/${record.id}/overview`)
  }

  const columns: ColumnsType<Project> = [
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      width: 50,
      render: (text, record) => <ProjectIcon icon={record.icon} name={record.name} />,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      filteredValue: filteredInfo.name ?? null,
      ...getColumnSearch("name"),
      onFilter: (value, record) => record.name.toLowerCase().includes(String(value).toLowerCase()),
      render: (text, record) => {
        const handleLinkClick = () => {
          if (!record.is_private || record.is_manageable) {
            handleShowProjectDetail(record.id)
          }
        }

        const linkEl = (
          <Link onClick={handleLinkClick}>
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment*/}
            <HighLighterTesty searchWords={searchText} textToHighlight={text} />
          </Link>
        )

        if (record.is_private && !record.is_manageable) {
          return (
            <Tooltip placement="topLeft" title="You are not able to manage this project" arrow>
              {linkEl}
            </Tooltip>
          )
        }

        return linkEl
      },
    },
    {
      title: "Archived",
      dataIndex: "is_archive",
      key: "is_archive",
      width: 150,
      filters: [
        {
          text: "Archived",
          value: true,
        },
      ],
      filteredValue: filteredInfo.is_archive ?? null,
      render: (is_archive: boolean) => <CheckedIcon value={is_archive} />,
    },
  ]

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPaginationParams({ page, pageSize })
  }

  const paginationTable: TablePaginationConfig = {
    hideOnSinglePage: false,
    pageSizeOptions: ["10", "20", "50", "100"],
    showLessItems: true,
    showSizeChanger: true,
    current: paginationParams.page,
    pageSize: paginationParams.pageSize,
    total: projects?.count ?? 0,
    onChange: handlePaginationChange,
  }

  return {
    columns,
    projects,
    isLoading,
    paginationTable,
    handleRowClick,
    handleChange,
    handleClearAll,
  }
}

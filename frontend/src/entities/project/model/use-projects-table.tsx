import { Typography } from "antd"
import { TableProps } from "antd/es/table"
import { ColumnsType, TablePaginationConfig } from "antd/lib/table"
import { FilterValue } from "antd/lib/table/interface"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAppDispatch } from "app/hooks"

import { useTableSearch } from "shared/hooks"
import { HighLighterTesty } from "shared/ui"
import { CheckedIcon } from "shared/ui/icons"

import { useGetProjectsQuery } from "../api"
import { setProjectId } from "./slice"

const { Link } = Typography

export const useProjectsTable = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { data: projects, isLoading } = useGetProjectsQuery(true)

  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({})
  const { setSearchText, getColumnSearch, searchText } = useTableSearch()

  const showProjectDetail = (projectId: Id) => {
    dispatch(setProjectId(projectId))
    return navigate(`/administration/projects/${projectId}/overview`)
  }

  const handleChange: TableProps<IProject>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>
  ) => {
    setFilteredInfo(filters)
  }

  const clearAll = () => {
    setFilteredInfo({})
    setSearchText("")
  }

  const handleRowClick = (id: Id) => {
    navigate(`/administration/projects/${id}/overview`)
  }

  const columns: ColumnsType<IProject> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      filteredValue: filteredInfo.name || null,
      ...getColumnSearch("name"),
      onFilter: (value, record) => record.name.toLowerCase().includes(String(value).toLowerCase()),
      render: (text, record) => (
        <Link
          onClick={() => {
            showProjectDetail(record.id)
          }}
        >
          <HighLighterTesty searchWords={searchText} textToHighlight={text} />
        </Link>
      ),
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
      filteredValue: filteredInfo.is_archive || null,
      onFilter: (_, record) => record.is_archive,
      render: (is_archive) => <CheckedIcon value={is_archive} />,
    },
  ]

  return {
    columns,
    projects,
    isLoading,
    handleRowClick,
    handleChange,
    clearAll,
  }
}

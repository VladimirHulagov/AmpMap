import { Space, TablePaginationConfig } from "antd"
import { ColumnsType, TableProps } from "antd/es/table"
import { FilterValue } from "antd/lib/table/interface"
import { DeleteUser, EditUser } from "features/user"
import { useState } from "react"

import { useGetUsersQuery } from "entities/user/api"
import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"

import { useTableSearch } from "shared/hooks"
import { CheckedIcon } from "shared/ui/icons"

export const useUsersTable = () => {
  const [paginationParams, setPaginationParams] = useState({
    page: 1,
    page_size: 10,
  })
  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({})
  const [filterInfoRequest, setFilteredInfoRequest] = useState<GetUsersQuery>({})

  const { data: users, isLoading } = useGetUsersQuery({
    ...paginationParams,
    ...filterInfoRequest,
  })

  const { setSearchText, getColumnSearch } = useTableSearch()

  const handleChange: TableProps<User>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>
  ) => {
    setFilteredInfo(filters)
    setFilteredInfoRequest((prevState) => ({
      ...prevState,
      username: filters?.username ? String(filters.username[0]) : undefined,
      email: filters?.email ? String(filters.email[0]) : undefined,
      first_name: filters?.first_name ? String(filters.first_name[0]) : undefined,
      last_name: filters?.last_name ? String(filters.last_name[0]) : undefined,
      is_active: filters?.is_active ? Boolean(filters.is_active[0]) : undefined,
      is_staff: filters?.is_staff ? Boolean(filters.is_staff[0]) : undefined,
    }))
  }

  const clearAll = () => {
    setFilteredInfo({})
    setFilteredInfoRequest({})
    setSearchText("")
  }

  const columns: ColumnsType<User> = [
    {
      key: "avatar",
      width: "32px",
      align: "right",
      render: (_, record) => <UserAvatar avatar_link={record.avatar_link} size={32} />,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      filteredValue: filteredInfo.username ?? null,
      ...getColumnSearch("username"),
      onFilter: (value, record) =>
        record.username.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      filteredValue: filteredInfo.email ?? null,
      ...getColumnSearch("email"),
      onFilter: (value, record) => record.email.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "First name",
      dataIndex: "first_name",
      key: "first_name",
      filteredValue: filteredInfo.first_name ?? null,
      ...getColumnSearch("first_name"),
      onFilter: (value, record) =>
        record.first_name.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "Last name",
      dataIndex: "last_name",
      key: "last_name",
      filteredValue: filteredInfo.last_name ?? null,
      ...getColumnSearch("last_name"),
      onFilter: (value, record) =>
        record.last_name.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "Active",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
      filters: [
        {
          text: "Active",
          value: true,
        },
      ],
      filteredValue: filteredInfo.is_active ?? null,
      onFilter: (_, record) => record.is_active,
      render: (is_active: boolean) => <CheckedIcon value={is_active} />,
    },
    {
      title: "Staff",
      dataIndex: "is_staff",
      key: "is_staff",
      width: 100,
      filters: [
        {
          text: "Staff",
          value: true,
        },
      ],
      filteredValue: filteredInfo.is_staff ?? null,
      onFilter: (_, record) => record.is_staff,
      render: (is_staff: boolean) => <CheckedIcon value={is_staff} />,
    },
    {
      title: "Action",
      key: "action",
      width: 110,
      render: (_, record) => (
        <Space>
          <EditUser user={record} />
          <DeleteUser user={record} />
        </Space>
      ),
    },
  ]

  const handlePaginationChange = (page: number, page_size: number) => {
    setPaginationParams({
      page,
      page_size,
    })
  }

  const paginationTable: TablePaginationConfig = {
    total: users?.pages.total ?? 0,
    hideOnSinglePage: false,
    pageSizeOptions: ["10", "20", "50", "100"],
    showLessItems: true,
    showSizeChanger: true,
    current: paginationParams.page,
    pageSize: paginationParams.page_size,
    onChange: handlePaginationChange,
  }

  return {
    users: users?.results ?? [],
    isLoading,
    columns,
    paginationTable,
    handleChange,
    clearAll,
  }
}

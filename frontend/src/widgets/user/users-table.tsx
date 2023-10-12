import { DeleteOutlined, EditOutlined } from "@ant-design/icons"
import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { Button, Modal, Space, Table, TableProps, notification } from "antd"
import { ColumnsType } from "antd/es/table"
import type { FilterValue, TablePaginationConfig } from "antd/es/table/interface"
import React, { useState } from "react"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { selectUser } from "entities/auth/model"

import { useDeleteUserMutation, useGetUsersQuery } from "entities/user/api"
import { setUser, showEditUserModal } from "entities/user/model"
import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"

import { useTableSearch } from "shared/hooks"
import { ContainerLoader } from "shared/ui"
import { CheckedIcon } from "shared/ui/icons"

export const UsersTable = () => {
  const user = useAppSelector(selectUser)
  const dispatch = useAppDispatch()
  const [deleteUser] = useDeleteUserMutation()

  const { data: users, isLoading } = useGetUsersQuery()

  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({})
  const { setSearchText, getColumnSearch } = useTableSearch()

  const handleChange: TableProps<User>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>
  ) => {
    setFilteredInfo(filters)
  }

  const clearAll = () => {
    setFilteredInfo({})
    setSearchText("")
  }

  const showUserDetails = (user: User) => {
    dispatch(setUser(user))
    dispatch(showEditUserModal())
  }

  const onOk = async (user: User) => {
    try {
      await deleteUser(user.id).unwrap()
      notification.success({
        message: "Success",
        description: "User deleted successfully",
      })
    } catch (err: unknown) {
      const error = err as FetchBaseQueryError

      console.error(error)
      notification.error({
        message: "Error!",
        description: "Internal server error. Showing in console log.",
      })
    }
  }

  const handleShowModalDelete = (user: User) => {
    Modal.confirm({
      title: "Do you want to delete these User?",
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async () => await onOk(user),
    })
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
      filteredValue: filteredInfo.username || null,
      ...getColumnSearch("username"),
      onFilter: (value, record) =>
        record.username.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      filteredValue: filteredInfo.email || null,
      ...getColumnSearch("email"),
      onFilter: (value, record) => record.email.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "First name",
      dataIndex: "first_name",
      key: "first_name",
      filteredValue: filteredInfo.first_name || null,
      ...getColumnSearch("first_name"),
      onFilter: (value, record) =>
        record.first_name.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "Last name",
      dataIndex: "last_name",
      key: "last_name",
      filteredValue: filteredInfo.last_name || null,
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
      filteredValue: filteredInfo.is_active || null,
      onFilter: (_, record) => record.is_active,
      render: (is_active) => <CheckedIcon value={is_active} />,
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
      filteredValue: filteredInfo.is_staff || null,
      onFilter: (_, record) => record.is_staff,
      render: (is_staff) => <CheckedIcon value={is_staff} />,
    },
    {
      title: "Action",
      key: "action",
      width: 110,
      render: (_, record) => (
        <Space>
          <Button
            id="show-user-details"
            icon={<EditOutlined />}
            shape="circle"
            onClick={() => showUserDetails(record)}
          />

          {String(user?.id) === String(record.id) ? null : (
            <Button
              id="delete-user-details"
              icon={<DeleteOutlined />}
              shape="circle"
              danger
              onClick={() => handleShowModalDelete(record)}
            />
          )}
        </Space>
      ),
    },
  ]

  if (isLoading) {
    return <ContainerLoader />
  }

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={clearAll}>
          Clear filters and sorters
        </Button>
      </Space>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="username"
        style={{ marginTop: 12 }}
        onChange={handleChange}
      />
    </>
  )
}

export default UsersTable

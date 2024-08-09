import { DeleteOutlined, EditOutlined } from "@ant-design/icons"
import { Button, Space, Table, TableProps } from "antd"
import { ColumnsType } from "antd/es/table"
import type { FilterValue, TablePaginationConfig } from "antd/es/table/interface"
import { useState } from "react"
import { useParams } from "react-router-dom"

import { useAppDispatch } from "app/hooks"

import { useGetLabelsQuery } from "entities/label/api"
import { getLabelTypeTextByNumber } from "entities/label/lib"
import { showLabelModal, useAdministrationLabelModal } from "entities/label/model"

import { useTableSearch } from "shared/hooks"

import { LabelCreateEditModal } from "../label-create-edit-modal"

export const LabelsTable = () => {
  const { projectId } = useParams<ParamProjectId>()
  const { data: labels, isLoading } = useGetLabelsQuery(
    { project: projectId ?? "" },
    { skip: !projectId }
  )
  const dispatch = useAppDispatch()
  const labelModal = useAdministrationLabelModal()

  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({})
  const { setSearchText, getColumnSearch } = useTableSearch()

  const handleChange: TableProps<Label>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>
  ) => {
    setFilteredInfo(filters)
  }

  const clearAll = () => {
    setFilteredInfo({})
    setSearchText("")
  }

  const columns: ColumnsType<Label> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: "70px",
      sorter: (a, b) => Number(a.id) - Number(b.id),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      filteredValue: filteredInfo.name ?? null,
      sorter: (a, b) => a.name.localeCompare(b.name),
      ...getColumnSearch("name"),
      onFilter: (value, record) => record.name.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      filteredValue: filteredInfo.type ?? null,
      filters: [
        {
          value: "0",
          text: "System",
        },
        {
          value: "1",
          text: "Custom",
        },
      ],
      onFilter: (value, record) => Number(record.type) === Number(value),
      render: (_, record) => getLabelTypeTextByNumber(record.type),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            id={`${record.name}-edit`}
            icon={<EditOutlined />}
            shape="circle"
            onClick={() => dispatch(showLabelModal({ label: record, mode: "edit" }))}
          />
          <Button
            id={`${record.name}-delete`}
            icon={<DeleteOutlined />}
            shape="circle"
            danger
            onClick={() => labelModal.handleDeleteLabel(Number(record.id))}
          />
        </Space>
      ),
    },
  ]

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={clearAll}>
          Clear filters and sorters
        </Button>
      </Space>
      <Table
        loading={isLoading}
        dataSource={labels}
        columns={columns}
        rowKey="id"
        style={{ marginTop: 12 }}
        onChange={handleChange}
        id="administration-projects-labels"
        rowClassName="administration-projects-labels-row"
      />
      <LabelCreateEditModal />
    </>
  )
}

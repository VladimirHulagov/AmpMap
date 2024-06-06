import { Button, Space, Table, TableProps } from "antd"
import { ColumnsType } from "antd/es/table"
import type { FilterValue, TablePaginationConfig } from "antd/es/table/interface"
import { useGetCustomAttributesQuery } from "entities/custom-attribute/api"
import { DeleteCustomAttribute, EditCustomAttribute } from "features/custom-attribute"
import { useState } from "react"
import { useParams } from "react-router-dom"

import { customAttributeTypes, customAttributesObject } from "shared/config/custom-attribute-types"
import { useTableSearch } from "shared/hooks"
import { ContainerLoader } from "shared/ui"

export const CustomAttributesTable = () => {
  const { projectId } = useParams<ParamProjectId>()

  const { data, isLoading } = useGetCustomAttributesQuery({ project: projectId ?? "" })

  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({})
  const { setSearchText, getColumnSearch } = useTableSearch()

  const handleChange: TableProps<CustomAttribute>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>
  ) => {
    setFilteredInfo(filters)
  }

  const clearAll = () => {
    setFilteredInfo({})
    setSearchText("")
  }

  const columns: ColumnsType<CustomAttribute> = [
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
      filters: customAttributeTypes.map(({ value, label }) => ({ value, text: label })),
      onFilter: (value, record) => record.type === value,
      render: (_, record) => <Space>{customAttributesObject[record.type]}</Space>,
    },
    {
      title: "Required",
      dataIndex: "is_required",
      key: "is_required",
      render: (_, record) => <Space>{String(record.is_required)}</Space>,
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Space>
          <EditCustomAttribute attribute={record} />
          <DeleteCustomAttribute attributeId={record.id} />
        </Space>
      ),
    },
  ]

  if (isLoading) return <ContainerLoader />

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={clearAll}>
          Clear filters and sorters
        </Button>
      </Space>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        style={{ marginTop: 12 }}
        onChange={handleChange}
        id="administration-projects-attributes"
        rowClassName="administration-projects-attributes-row"
      />
    </>
  )
}

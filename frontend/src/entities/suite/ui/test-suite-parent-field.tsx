import { Select, Spin } from "antd"
import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"
import { useParams } from "react-router-dom"

import { useLazyGetTestSuitesQuery } from "../api"

interface Props {
  handleSelectParent: (value?: { label: string; value: number }) => void
  selectedParent: { label: string; value: number } | null
  handleClearParent: () => void
}

export const TestSuiteParentField = ({
  selectedParent,
  handleClearParent,
  handleSelectParent,
}: Props) => {
  const { projectId } = useParams<ParamProjectId>()
  const [search, setSearch] = useState<string>("")
  const [dataTestSuites, setDataTestSuites] = useState<ISuite[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [getTestSuites, { data: dataGetTestSuites, isLoading: isLoadingGetTestSuites }] =
    useLazyGetTestSuitesQuery()
  const [isLastPage, setIsLastPage] = useState(false)

  const { ref, inView } = useInView()
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearch = async (newValue: string) => {
    if (!newValue.length) {
      setDataTestSuites([])
      setSearch("")
      setIsLastPage(false)
      return
    }

    setIsLoading(true)
    const res = await getTestSuites({
      page: 1,
      page_size: 10,
      search: newValue,
      project: projectId,
      is_flat: true,
    }).unwrap()

    if (!res.pages.next) {
      setIsLastPage(true)
    }

    setDataTestSuites(res.results)
    setSearch(newValue)
    setIsLoading(false)
  }

  const handleChange = (dataValue?: { label: string; value: number }) => {
    if (!dataValue) {
      handleClearParent()
      return
    }

    handleSelectParent(dataValue)
  }

  useEffect(() => {
    if (!inView || !search.length || isLastPage || isLoadingGetTestSuites) return

    const fetch = async () => {
      setIsLoading(true)

      const res = await getTestSuites({
        page: currentPage + 1,
        page_size: 10,
        search,
        project: projectId,
        is_flat: true,
      }).unwrap()

      if (!res.pages.next) {
        setIsLastPage(true)
      }

      setDataTestSuites((prevState) => [...prevState, ...res.results])
      if (res.pages.current < res.pages.total) {
        setCurrentPage((prev) => prev + 1)
      }

      setIsLoading(false)
    }

    fetch()
  }, [inView, search, isLastPage, isLoadingGetTestSuites, dataGetTestSuites])

  return (
    <Select
      id="select-test-suite-parent"
      value={selectedParent}
      showSearch
      labelInValue
      placeholder="Search a parent suite"
      defaultActiveFirstOption={false}
      showArrow
      filterOption={false}
      onSearch={handleSearch}
      onChange={handleChange}
      notFoundContent="No matches"
      allowClear
    >
      {dataTestSuites.map((plan) => (
        <Select.Option key={plan.id} value={plan.id}>
          {plan.name}
        </Select.Option>
      ))}
      {dataTestSuites.length && !isLastPage && !isLoading && !isLoadingGetTestSuites && (
        <Select.Option value="">
          <div ref={ref} />
        </Select.Option>
      )}
      {isLoading && (
        <Select.Option value="">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Spin />
          </div>
        </Select.Option>
      )}
    </Select>
  )
}

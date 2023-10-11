import { Select, Spin } from "antd"
import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"
import { useParams } from "react-router-dom"

import { useLazyGetTestPlansQuery } from "entities/test-plan/api"

interface Props {
  handleSelectParent: (value?: { label: string; value: number }) => void
  selectedParent: { label: string; value: number } | null
  handleClearParent: () => void
}

export const TestPlanParentField = ({
  selectedParent,
  handleClearParent,
  handleSelectParent,
}: Props) => {
  const { projectId } = useParams<ParamProjectId>()
  const [search, setSearch] = useState<string>("")
  const [dataTestPlans, setDataTestPlans] = useState<ITestPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [getTestPlans, { data: dataGetTestPlans, isLoading: isLoadingGetTestPlans }] =
    useLazyGetTestPlansQuery()
  const [isLastPage, setIsLastPage] = useState(false)

  const { ref, inView } = useInView()
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearch = async (newValue: string) => {
    if (!newValue.length) {
      setDataTestPlans([])
      setSearch("")
      setIsLastPage(false)
      return
    }

    setIsLoading(true)
    const res = await getTestPlans({
      page: 1,
      page_size: 10,
      search: newValue,
      projectId,
      showArchive: true,
      is_flat: true,
    }).unwrap()

    if (!res.pages.next) {
      setIsLastPage(true)
    }

    setDataTestPlans(res.results)
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
    if (!inView || !search.length || isLastPage || isLoadingGetTestPlans) return

    const fetch = async () => {
      setIsLoading(true)

      const res = await getTestPlans({
        page: currentPage + 1,
        page_size: 10,
        search,
        projectId,
        showArchive: true,
        is_flat: true,
      }).unwrap()

      if (!res.pages.next) {
        setIsLastPage(true)
      }

      setDataTestPlans((prevState) => [...prevState, ...res.results])
      if (res.pages.current < res.pages.total) {
        setCurrentPage((prev) => prev + 1)
      }

      setIsLoading(false)
    }

    fetch()
  }, [inView, search, isLastPage, isLoadingGetTestPlans, dataGetTestPlans])

  return (
    <Select
      id="select-test-plan-parent"
      value={selectedParent}
      showSearch
      labelInValue
      placeholder="Search a parent plan"
      defaultActiveFirstOption={false}
      showArrow
      filterOption={false}
      onSearch={handleSearch}
      onChange={handleChange}
      notFoundContent="No matches"
      allowClear
    >
      {dataTestPlans.map((plan) => (
        <Select.Option key={plan.id} value={plan.id}>
          {plan.title}
        </Select.Option>
      ))}
      {dataTestPlans.length && !isLastPage && !isLoading && !isLoadingGetTestPlans && (
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

import { Select, Spin } from "antd"
import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"

import { useLazyGetUsersQuery } from "../api"
import { UserAvatar } from "./user-avatar/user-avatar"

interface Props {
  handleChange: (value?: SelectData) => void
  handleClear: () => void
  selectedUser?: SelectData | null
  placeholder?: string
}

interface OptionProps {
  user: User
}

export const UserSearchOption = ({ user }: OptionProps) => {
  return (
    <div style={{ display: "flex", alignItems: "center", flexDirection: "row", gap: 8 }}>
      <div style={{ width: 20, height: 20 }}>
        <UserAvatar avatar_link={user.avatar_link} size={20} />
      </div>
      <span>{user.username}</span>
    </div>
  )
}

export const UserSearchInput = ({
  selectedUser,
  handleClear,
  handleChange: handleChangeUserSearchInput,
  placeholder = "Search a user",
}: Props) => {
  const [search, setSearch] = useState<string>("")
  const [data, setData] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [getUsers, { data: dataGetTestSuites, isLoading: isLoadingGetTestSuites }] =
    useLazyGetUsersQuery()
  const [isLastPage, setIsLastPage] = useState(false)

  const { ref, inView } = useInView()
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearch = async (newValue: string) => {
    if (!newValue.length) {
      setData([])
      setSearch("")
      setIsLastPage(false)
      return
    }

    setIsLoading(true)
    const res = await getUsers({
      page: 1,
      page_size: 10,
      username: newValue,
    }).unwrap()

    if (!res.pages.next) {
      setIsLastPage(true)
    }

    setData(res.results)
    setSearch(newValue)
    setIsLoading(false)
  }

  const handleChange = (dataValue?: SelectData) => {
    if (!dataValue) {
      handleClear()
      return
    }

    handleChangeUserSearchInput(dataValue)
  }

  useEffect(() => {
    if (!inView || !search.length || isLastPage || isLoadingGetTestSuites) return

    const fetch = async () => {
      setIsLoading(true)

      const res = await getUsers({
        page: currentPage + 1,
        page_size: 10,
      }).unwrap()

      if (!res.pages.next) {
        setIsLastPage(true)
      }

      setData((prevState) => [...prevState, ...res.results])
      if (res.pages.current < res.pages.total) {
        setCurrentPage((prev) => prev + 1)
      }

      setIsLoading(false)
    }

    fetch()
  }, [inView, search, isLastPage, isLoadingGetTestSuites, dataGetTestSuites])

  return (
    <Select
      id="select-user"
      value={selectedUser}
      showSearch
      labelInValue
      placeholder={placeholder}
      defaultActiveFirstOption={false}
      showArrow
      filterOption={false}
      onSearch={handleSearch}
      onChange={handleChange}
      notFoundContent="No matches"
      allowClear
      style={{ width: "100%" }}
    >
      {data.map((user) => (
        <Select.Option key={user.id} value={user.id}>
          <UserSearchOption user={user} />
        </Select.Option>
      ))}
      {!!data.length && !isLastPage && !isLoading && !isLoadingGetTestSuites && (
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

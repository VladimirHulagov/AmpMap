import { SearchOutlined } from "@ant-design/icons"
import { Flex, Input, Popover, Spin } from "antd"
import classNames from "classnames"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useInView } from "react-intersection-observer"

import { useLazyGetUsersQuery } from "entities/user/api"

import CloseIcon from "shared/assets/yi-icons/close.svg?react"
import { useDebounce } from "shared/hooks"
import { Button } from "shared/ui"

import styles from "./styles.module.css"
import { UserSearchOption } from "./user-search-option"

interface Props {
  onChange: (value?: SelectData) => void
  onClear: () => void
  label: React.ReactNode
  activeTest: Test | null
  onSubmitForm: (e?: React.BaseSyntheticEvent) => Promise<void>
  onAssignToMe: () => void
  isAssigenMe: boolean
  isDirty: boolean
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  selectedUser?: SelectData | null
  placeholder?: string
  project?: Project
  isLoadingUpdate?: boolean
  canChange?: boolean
}

export const UserSearchPopover = ({
  activeTest,
  selectedUser,
  onClear,
  onChange,
  onSubmitForm,
  project,
  label,
  onAssignToMe,
  isAssigenMe,
  isDirty,
  canChange = true,
  isLoadingUpdate,
  isOpen,
  onOpen,
  onClose,
}: Props) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState<string>("")
  const debounceSearch = useDebounce(search, 250)
  const [data, setData] = useState<User[]>([])
  const [getUsers, { isFetching }] = useLazyGetUsersQuery()
  const [isLastPage, setIsLastPage] = useState(false)

  const { ref, inView } = useInView()
  const [currentPage, setCurrentPage] = useState(1)

  const additionalFilter = project
    ? { [project.is_private ? "project" : "exclude_external"]: project.id }
    : {}

  const handleSearch = (newValue: string) => {
    setIsLastPage(false)
    setCurrentPage(1)
    setSearch(newValue)
    setData([])
  }

  const handleChange = (dataValue?: SelectData) => {
    if (!dataValue) {
      onClear()
      return
    }

    onChange(dataValue)
  }

  const handleUnAssign = async () => {
    onClear()
    await onSubmitForm()
  }

  const handleAssignToMe = () => {
    onAssignToMe()
  }

  const handleResetUser = () => {
    onChange({
      label: activeTest?.assignee_username ?? "",
      // @ts-ignore
      value: activeTest?.assignee ?? "",
    })
  }

  useEffect(() => {
    if (
      (!inView && currentPage !== 1) ||
      !debounceSearch.length ||
      isLastPage ||
      debounceSearch !== search
    ) {
      return
    }

    const fetch = async () => {
      const res = await getUsers({
        page: currentPage,
        page_size: 20,
        username: debounceSearch,
        is_active: true,
        ...additionalFilter,
      }).unwrap()

      if (!res.pages.next) {
        setIsLastPage(true)
      }

      if (res.results.length === 0) {
        setData([])
      } else {
        setData((prevState) => [...prevState, ...res.results])
      }

      if (res.pages.current < res.pages.total) {
        setCurrentPage((prev) => prev + 1)
      }
    }

    fetch()
  }, [inView, debounceSearch, isLastPage, currentPage])

  useEffect(() => {
    if (!isOpen) {
      setIsLastPage(false)
      setCurrentPage(1)
      setSearch("")
      setData([])
    }
  }, [isOpen])

  const handleOpenChange = (opened: boolean) => {
    opened ? onOpen() : onClose()
  }

  return (
    <Popover
      placement="bottomLeft"
      trigger="click"
      open={canChange && isOpen}
      onOpenChange={handleOpenChange}
      overlayInnerStyle={{ padding: 0 }}
      arrow={false}
      id="user-search-popover"
      content={
        <div style={{ width: 356 }}>
          <Input
            onChange={(e) => handleSearch(e.target.value)}
            suffix={<SearchOutlined width={24} height={24} />}
            prefix={
              activeTest?.assignee !== selectedUser?.value &&
              selectedUser?.label && (
                <div className={styles.inputSelectedUser}>
                  <span data-testid="selected-user">{selectedUser.label}</span>
                  <CloseIcon
                    className={styles.resetSelectedUserIcon}
                    onClick={handleResetUser}
                    data-testid="reset-selected-user-option"
                  />
                </div>
              )
            }
            rootClassName={styles.userSearchPopoverInput}
            placeholder={t("Search a user")}
            value={search}
            data-testid="user-search-input"
          />
          <div style={{ padding: 16, paddingTop: 8 }}>
            <Flex gap={8} style={{ fontSize: 12, marginBottom: 8 }}>
              {!isAssigenMe && (
                <Button onClick={handleAssignToMe} id="assign-to-me-button" color="secondary">
                  {t("Assigned to me")}
                </Button>
              )}
              {!!activeTest?.assignee && (
                <Button onClick={handleUnAssign} id="unassign-button" color="secondary">
                  {t("Not Assigned")}
                </Button>
              )}
            </Flex>
            <ul className={styles.userSearchPopoverList} data-testid="user-search-list">
              {data.length === 0 && !isFetching && <span>{t("No matches")}</span>}
              {data.map((user) => (
                <div
                  key={user.id}
                  data-testid={`user-search-option-${user.id}`}
                  className={classNames(styles.userOption, {
                    [styles.selectedUser]: selectedUser?.value === user.id,
                  })}
                  onClick={() => {
                    handleChange({ value: user.id, label: user.username })
                  }}
                >
                  <UserSearchOption user={user} key={user.id} />
                </div>
              ))}
              {isFetching && (
                <div className={styles.spinner}>
                  <Spin />
                </div>
              )}
              {!!data.length && !isLastPage && !isFetching && (
                <div style={{ minHeight: 1 }} ref={ref} key="trigger" />
              )}
            </ul>
            <Flex gap={8} style={{ marginTop: 8 }}>
              <Button
                key="submit"
                color="accent"
                loading={isLoadingUpdate}
                onClick={onSubmitForm}
                disabled={
                  !isDirty ||
                  !selectedUser?.label ||
                  selectedUser.value === Number(activeTest?.assignee)
                }
                id="user-search-apply"
              >
                {t("Apply")}
              </Button>
              <Button onClick={onClose} id="user-search-cancel" color="secondary">
                {t("Cancel")}
              </Button>
            </Flex>
          </div>
        </div>
      }
    >
      {label}
    </Popover>
  )
}

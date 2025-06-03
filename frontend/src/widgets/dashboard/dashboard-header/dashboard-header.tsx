import { Flex, Input } from "antd"
import classNames from "classnames"
import { useMeContext } from "processes"
import { useTranslation } from "react-i18next"

import { CreateProject } from "features/project"
import { ChangeLang, ChangeTheme } from "features/system"

import ColumnViewIcon from "shared/assets/yi-icons/column-view.svg?react"
import TableIcon from "shared/assets/yi-icons/table.svg?react"
import { Toggle } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  searchText: string
  onChangeSearch: (value: string) => void
  onIsOnlyFavoriteClick: (checked: boolean) => void
  onShowArchived: (checked: boolean) => void
  view: "cards" | "table"
  setView: (view: "cards" | "table") => void
}

export const DashboardHeader = ({
  searchText,
  onChangeSearch,
  onIsOnlyFavoriteClick,
  onShowArchived,
  view,
  setView,
}: Props) => {
  const { t } = useTranslation()
  const { userConfig } = useMeContext()

  return (
    <div className={styles.header} data-testid="dashboard-header">
      <div className={styles.searchBlock} data-testid="dashboard-header-search">
        <Input.Search
          placeholder={t("Search")}
          value={searchText}
          onChange={(e) => onChangeSearch(e.target.value)}
          size="large"
          allowClear
          data-testid="dashboard-header-search-input"
        />
      </div>
      <Flex align="center" gap={16} className={styles.row}>
        <Toggle
          id="only-favorites-switcher"
          checked={userConfig?.projects?.is_only_favorite}
          onChange={onIsOnlyFavoriteClick}
          label={t("Favorites")}
          size="lg"
        />
        <Toggle
          id="show-archived-switcher"
          checked={userConfig?.projects?.is_show_archived}
          onChange={onShowArchived}
          label={t("Archives")}
          size="lg"
        />
      </Flex>
      <Flex gap={16}>
        <ChangeTheme />
        <ChangeLang />
        <CreateProject />
      </Flex>
      <Flex align="center" gap={4} style={{ marginLeft: 16 }}>
        <button
          type="button"
          className={classNames(styles.viewBtn, { [styles.active]: view === "cards" })}
          onClick={() => setView("cards")}
          data-testid="dashboard-header-view-btn-cards"
        >
          <ColumnViewIcon width={24} height={24} />
        </button>
        <button
          type="button"
          className={classNames(styles.viewBtn, { [styles.active]: view === "table" })}
          onClick={() => setView("table")}
          data-testid="dashboard-header-view-btn-table"
        >
          <TableIcon width={24} height={24} />
        </button>
      </Flex>
    </div>
  )
}

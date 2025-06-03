import classNames from "classnames"
import { HTMLAttributes, ReactNode } from "react"
import { useTranslation } from "react-i18next"

import styles from "./styles.module.css"

interface Props extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  visibleColumns: ColumnParam[]
  hasAddResult?: boolean
  bordered?: boolean
}

export const TreeTable = ({
  children,
  visibleColumns,
  hasAddResult = true,
  bordered = true,
}: Props) => {
  const { t } = useTranslation()

  return (
    <div className={classNames(styles.tableWrapper, { [styles.bordered]: bordered })}>
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            {visibleColumns.map((col) => (
              // @ts-ignore
              <th key={col.key}>{t(col.title)}</th>
            ))}
            {hasAddResult && <th key="add_result"></th>}
          </tr>
        </thead>
        <tbody className={styles.tableBody}>{children}</tbody>
      </table>
    </div>
  )
}

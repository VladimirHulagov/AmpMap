import classNames from "classnames"

import { Button } from "../button"
import styles from "./styles.module.css"

interface Props {
  id: string
  tab: "md" | "view"
  handleTabClick: (tab: "md" | "view") => void
}

export const MarkdownViewerTabs = ({ id, tab, handleTabClick }: Props) => {
  return (
    <div className={styles.tabs}>
      <Button
        id={`${id}-tabs-md`}
        className={classNames(styles.tab, {
          [styles.active]: tab === "md",
        })}
        type="button"
        onClick={() => handleTabClick("md")}
      >
        editor (.md)
      </Button>
      <Button
        id={`${id}-tabs-view`}
        className={classNames(styles.tab, {
          [styles.active]: tab === "view",
        })}
        type="button"
        onClick={() => handleTabClick("view")}
      >
        visual
      </Button>
    </div>
  )
}

import classNames from "classnames"

import styles from "./styles.module.css"

export const MarkdownCheckbox = (props: React.HTMLAttributes<HTMLInputElement>) => {
  return (
    <label className={classNames("y-checkbox-s", styles.checkbox)}>
      <input className={styles.checkboxInput} type="checkbox" {...props} disabled={false} />
      <span className="y-icon-tick" />
    </label>
  )
}

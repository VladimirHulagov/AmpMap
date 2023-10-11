import { ProjectOverviewProgressBlock } from "./progress-block"
import styles from "./styles.module.css"

export const ProjectOverview = () => {
  return (
    <div className={styles.wrapper}>
      <ProjectOverviewProgressBlock />
    </div>
  )
}

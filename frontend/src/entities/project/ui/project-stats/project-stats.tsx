import classNames from "classnames"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import TestPlansIcon from "shared/assets/yi-icons/test-plans.svg?react"
import TestSuitesIcon from "shared/assets/yi-icons/test-suites.svg?react"

import styles from "./styles.module.css"

interface Props {
  projectId: number
  testSuites: number
  testCases: number
  testPlans: number
  tests: number
}

export const ProjectStats = ({
  projectId,
  testSuites = 0,
  testCases = 0,
  testPlans = 0,
  tests = 0,
}: Props) => {
  const { t } = useTranslation()

  return (
    <ul className={styles.wrapper} data-testid="project-stats">
      <Link
        to={`/projects/${projectId}/suites`}
        className={classNames(styles.card, styles.link)}
        style={{ borderColor: "var(--y-graph-primary)" }}
        data-testid="project-stats-test-suites"
      >
        <div className={styles.cardContent}>
          <span className={styles.cardTitle}>{t("Test Suites")}</span>
          <span className={styles.cardValue}>{testSuites}</span>
        </div>
        <TestSuitesIcon className={styles.cardIcon} />
      </Link>
      <li
        className={styles.card}
        style={{ borderColor: "var(--y-graph-secondary)" }}
        data-testid="project-stats-test-cases"
      >
        <div className={styles.cardContent}>
          <span className={styles.cardTitle}>{t("Test Cases")}</span>
          <span className={styles.cardValue}>{testCases}</span>
        </div>
      </li>
      <Link
        to={`/projects/${projectId}/plans`}
        className={classNames(styles.card, styles.link)}
        style={{ borderColor: "var(--y-graph-fourth)" }}
        data-testid="project-stats-test-plans"
      >
        <div className={styles.cardContent}>
          <span className={styles.cardTitle}>{t("Test Plans")}</span>
          <span className={styles.cardValue}>{testPlans}</span>
        </div>
        <TestPlansIcon className={styles.cardIcon} />
      </Link>
      <li
        className={styles.card}
        style={{ borderColor: "var(--y-graph-fifth)" }}
        data-testid="project-stats-tests"
      >
        <div className={styles.cardContent}>
          <span className={styles.cardTitle}>{t("Tests")}</span>
          <span className={styles.cardValue}>{tests}</span>
        </div>
      </li>
    </ul>
  )
}

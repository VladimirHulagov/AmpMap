import cn from "classnames"
import { Fragment, memo, useMemo } from "react"
import { Link } from "react-router-dom"

import { useGetBreadcrumbsQuery as useGetSuitesBreadcrumbsQuery } from "entities/suite/api"

import { useGetBreadcrumbsQuery as useGetPlansBreadcrumbsQuery } from "entities/test-plan/api"

import { useProjectContext } from "pages/project/project-provider"

import styles from "./styles.module.css"

const formatToArray = (
  breadcrumbs: EntityBreadcrumbs,
  arr: { id: number; title: string; parent: EntityBreadcrumbs | null }[]
) => {
  arr.push(breadcrumbs)
  if (breadcrumbs.parent) {
    formatToArray(breadcrumbs.parent, arr)
  }
  return arr
}

interface Props {
  activeTab: "suites" | "plans"
  entityId?: number | string
  rootId: string | null
}

export const TreebarBreadcrumbs = memo(({ activeTab, entityId, rootId }: Props) => {
  const project = useProjectContext()

  const { data: dataSuites } = useGetSuitesBreadcrumbsQuery(Number(entityId), {
    skip: activeTab !== "suites" || !entityId,
  })
  const { data: dataPlans } = useGetPlansBreadcrumbsQuery(Number(entityId), {
    skip: activeTab !== "plans" || !entityId,
  })
  const data = activeTab === "suites" ? dataSuites : dataPlans

  const breadcrumbs = useMemo(() => {
    if (!entityId) {
      return []
    }

    return data ? formatToArray(data, []).reverse() : []
  }, [data, entityId])

  return (
    <div className={styles.breadcrumbsBlock} data-testid="treebar-breadcrumbs-block">
      <Link
        to={`/projects/${project.id}/${activeTab}/`}
        className={styles.breadcrumbsTitle}
        data-testid="treebar-breadcrumbs-home"
      >
        HOME
      </Link>
      {breadcrumbs.map((breadcrumb, index) => (
        <Fragment key={breadcrumb.id}>
          <span className={styles.breadcrumbsDiv}>/</span>
          {index === breadcrumbs.length - 1 ? (
            <span
              className={cn(styles.breadcrumbsSimpleText, styles.breadcrumbsTitle)}
              data-testid={`treebar-breadcrumbs-title-${breadcrumb.title}`}
            >
              {breadcrumb.title}
            </span>
          ) : (
            <Link
              to={`/projects/${project.id}/${activeTab}/${breadcrumb.id}${rootId ? `?rootId=${breadcrumb.id}` : ""}`}
              className={cn(styles.breadcrumbsLink, styles.breadcrumbsTitle)}
              data-testid={`treebar-breadcrumbs-title-${breadcrumb.title}`}
            >
              {breadcrumb.title}
            </Link>
          )}
        </Fragment>
      ))}
    </div>
  )
})

TreebarBreadcrumbs.displayName = "TreebarBreadcrumbs"

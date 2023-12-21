import { Breadcrumb } from "antd"
import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"

import { useGetProjectQuery } from "entities/project/api"

import { useGetSuiteParentsQuery } from "entities/suite/api"

import { useGetTestPlanParentsQuery } from "entities/test-plan/api"

interface BreadCrumbElement {
  type: "suites" | "plans"
  key: string | number
  projectId: string
  id: number
  title: string
}

export const useBreadcrumbs = () => {
  const { projectId, testPlanId, testSuiteId } = useParams<
    ParamProjectId & ParamTestPlanId & ParamTestSuiteId
  >()
  const { data: project, isLoading: isLoadingProject } = useGetProjectQuery(Number(projectId), {
    skip: !projectId,
  })
  const { data: testPlan } = useGetTestPlanParentsQuery(String(testPlanId), { skip: !testPlanId })
  const { data: testSuite } = useGetSuiteParentsQuery(String(testSuiteId), { skip: !testSuiteId })

  const getElement = ({ type, key, id, projectId, title }: BreadCrumbElement) => {
    return (
      <Breadcrumb.Item key={key}>
        <Link to={`/projects/${projectId}/${type}/${id}`}>{title}</Link>
      </Breadcrumb.Item>
    )
  }

  const getBreadCrumbs = (data: TestPlanParent, projectId: string, type: "suites" | "plans") => {
    const list: JSX.Element[] = []
    const getBreadCrumbItem = (data: TestPlanParent) => {
      const el = getElement({
        type,
        key: data.id,
        projectId,
        id: data.id,
        title: data.title,
      })
      list.push(el)

      if (data.parent) {
        getBreadCrumbItem(data.parent)
      }
    }
    getBreadCrumbItem(data)
    return list.reverse()
  }

  const breadCrumbsPlans = useMemo(() => {
    if (!testPlan || !projectId) return []
    return getBreadCrumbs(testPlan, projectId, "plans")
  }, [testPlan, projectId])

  const breadCrumbsSuites = useMemo(() => {
    if (!testSuite || !projectId) return []
    return getBreadCrumbs(testSuite, projectId, "suites")
  }, [testSuite, projectId])

  const breadCrumbs = useMemo(() => {
    if (!project) return []

    const baseBreadCrumbs = [
      <Breadcrumb.Item key="dashboard">
        <Link to="/">Dashboard</Link>
      </Breadcrumb.Item>,
    ]

    if ((!testPlanId || !testPlan) && (!testSuiteId || !testSuite)) {
      return baseBreadCrumbs.concat([
        <Breadcrumb.Item key={projectId}>{project.name}</Breadcrumb.Item>,
      ])
    }

    const projectCrumb = (
      <Breadcrumb.Item key={projectId}>
        <Link to={`/projects/${project.id}`}>{project.name}</Link>
      </Breadcrumb.Item>
    )

    if (testPlan && testPlanId && (!testSuite || !testSuiteId)) {
      return baseBreadCrumbs.concat(projectCrumb).concat(breadCrumbsPlans)
    }

    if (testSuite && testSuiteId && (!testPlan || !testPlanId)) {
      return baseBreadCrumbs.concat(projectCrumb).concat(breadCrumbsSuites)
    }

    return []
  }, [project, projectId, testPlanId, testPlan, testSuiteId, testSuite])

  return {
    breadCrumbs,
    isLoadingProject,
    project,
  }
}

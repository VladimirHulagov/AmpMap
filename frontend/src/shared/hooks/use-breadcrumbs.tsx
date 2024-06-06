import { Breadcrumb } from "antd"
import { useMemo } from "react"
import { Link, useLocation, useParams } from "react-router-dom"

import { useGetProjectQuery } from "entities/project/api"

import { useGetSuiteQuery } from "entities/suite/api"

import { useGetTestPlanQuery } from "entities/test-plan/api"

import { capitalizeFirstLetter } from "shared/libs"

interface BreadCrumbElement {
  type: "suites" | "plans"
  key: string | number
  projectId: string
  id: number
  title: string
}

const getTestCasePageType = (pathname: string) => {
  let type: string | null = null
  if (pathname.endsWith("/new-test-case")) {
    type = "new"
  } else if (pathname.endsWith("/edit-test-case")) {
    type = "edit"
  }
  return type
}

export const useBreadcrumbs = () => {
  const { projectId, testPlanId, testSuiteId } = useParams<
    ParamProjectId & ParamTestPlanId & ParamTestSuiteId
  >()

  const { pathname, search } = useLocation()

  const { data: project, isLoading: isLoadingProject } = useGetProjectQuery(Number(projectId), {
    skip: !projectId,
  })
  const { data: testPlan } = useGetTestPlanQuery(
    { testPlanId: String(testPlanId) },
    { skip: !testPlanId }
  )
  const { data: testSuite } = useGetSuiteQuery(Number(testSuiteId), { skip: !testSuiteId })

  const testCasePageType = useMemo(() => getTestCasePageType(pathname), [pathname])

  const getElement = ({ type, key, id, projectId, title }: BreadCrumbElement) => {
    return (
      <Breadcrumb.Item key={key}>
        <Link to={`/projects/${projectId}/${type}/${id}`}>{title}</Link>
      </Breadcrumb.Item>
    )
  }

  const getBreadCrumbs = (data: TestPlan | Suite, projectId: string, type: "suites" | "plans") => {
    const list: JSX.Element[] = []
    const getBreadCrumbItem = (data: Breadcrumbs) => {
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
    getBreadCrumbItem(data.breadcrumbs)
    return list.reverse()
  }

  const getBreadCrumbTestCase = (type: string) => (
    <Breadcrumb.Item key={`${type}-test-case`}>
      <Link to={`/projects/${projectId}/suites/${testSuite?.id}/${type}-test-case${search}`}>
        {`${capitalizeFirstLetter(type)} Test Case`}
      </Link>
    </Breadcrumb.Item>
  )

  const breadCrumbsPlans = useMemo(() => {
    if (!testPlan || !projectId) return []
    return getBreadCrumbs(testPlan, projectId, "plans")
  }, [testPlan, projectId])

  const breadCrumbsSuites = useMemo(() => {
    if (!testSuite || !projectId) return []
    const res = getBreadCrumbs(testSuite, projectId, "suites")
    return testCasePageType ? res.concat(getBreadCrumbTestCase(testCasePageType)) : res
  }, [testSuite, projectId, testCasePageType])

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
  }, [project, projectId, testPlanId, testPlan, testSuiteId, testSuite, testCasePageType])

  return {
    breadCrumbs,
    isLoadingProject,
    project,
  }
}

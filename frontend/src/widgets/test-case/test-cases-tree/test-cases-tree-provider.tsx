import {
  PropsWithChildren,
  RefObject,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react"

import { useAppSelector } from "app/hooks"

import { useLazyGetTestSuitesWithTestCasesQuery } from "entities/suite/api"
import { useLazyGetTestSuiteAncestorsQuery } from "entities/suite/api"

import { selectDrawerTestCase, selectFilter, selectOrdering } from "entities/test-case/model"

import { ProjectContext } from "pages/project"

import { config } from "shared/config"
import {
  LazyNodeProps,
  LazyTreeApi,
  NodeId,
  TreeBaseFetcherParams,
  TreeFetcherAncestors,
  TreeNodeData,
  TreeNodeFetcher,
} from "shared/libs/tree"

const checkIsOpen = (item: Suite | TestCase, drawerTestCase: TestCase | null) => {
  if (item.is_leaf || !drawerTestCase) {
    return false
  }

  return item.id === Number(drawerTestCase?.suite.id)
}

export interface TestCasesTreeContextType {
  fetcher: TreeNodeFetcher<Suite | TestCase, LazyNodeProps>
  fetcherAncestors: TreeFetcherAncestors
  testCasesTree: RefObject<LazyTreeApi<TestCase | Suite, LazyNodeProps>>
  skipInit: boolean
}

export const TestCasesTreeContext = createContext<TestCasesTreeContextType | null>(null)

export const TestCasesTreeProvider = ({ children }: PropsWithChildren) => {
  const { project } = useContext(ProjectContext)!

  const testCasesTree = useRef<LazyTreeApi<TestCase | Suite, LazyNodeProps>>(null)

  const testCasesTreeFilter = useAppSelector(selectFilter)
  const testCasesTreeOrdering = useAppSelector(selectOrdering)
  const drawerTestCase = useAppSelector(selectDrawerTestCase)

  const [getSuiteWithTests] = useLazyGetTestSuitesWithTestCasesQuery()
  const [getAncestors] = useLazyGetTestSuiteAncestorsQuery()

  const fetcher = useCallback(
    async (params: TreeBaseFetcherParams) => {
      const res = await getSuiteWithTests(
        {
          project: project.id,
          page: params.page,
          parent: params.parent ? Number(params.parent) : null,
          page_size: config.defaultTreePageSize,
          ordering: testCasesTreeOrdering,
          is_archive: testCasesTreeFilter.is_archive,
          search: testCasesTreeFilter.name_or_id,
          suite: testCasesTreeFilter.suites,
          labels: testCasesTreeFilter.labels,
          not_labels: testCasesTreeFilter.not_labels,
          labels_condition: testCasesTreeFilter.labels_condition,
          test_case_created_after: testCasesTreeFilter.test_case_created_after,
          test_case_created_before: testCasesTreeFilter.test_case_created_before,
          test_suite_created_after: testCasesTreeFilter.test_suite_created_after,
          test_suite_created_before: testCasesTreeFilter.test_suite_created_before,
          _n: params._n,
        },
        false
      ).unwrap()
      const data: TreeNodeData<Suite | TestCase, LazyNodeProps>[] = res.results.map((item) => {
        const isOpen = checkIsOpen(item, drawerTestCase)

        return {
          id: item.id,
          data: item,
          title: item.name,
          children: [],
          parent: params.parent ? params.parent : null,
          props: {
            canOpen: item.has_children,
            isLeaf: item.is_leaf,
            isLoading: false,
            isMoreLoading: false,
            isChecked: false,
            isHalfChecked: false,
            isSelected: false,
            isOpen,
            hasMore: false,
            page: params.page,
            level: params.level,
          },
        }
      })

      return { data, nextInfo: res.pages, _n: params._n }
    },
    [testCasesTreeFilter, testCasesTreeOrdering, drawerTestCase]
  )

  const fetcherAncestors = (id: NodeId) => {
    return getAncestors({ project: project.id, id: Number(id) }).unwrap()
  }

  const value = useMemo(() => {
    return {
      fetcher,
      fetcherAncestors,
      testCasesTree,
      skipInit: false,
    }
  }, [testCasesTree, fetcher, fetcherAncestors])

  return <TestCasesTreeContext.Provider value={value}>{children}</TestCasesTreeContext.Provider>
}

import { LazyNodeProps, TreeBaseFetcherParams, TreeNodeData } from "shared/libs/tree"

// eslint-disable-next-line comma-spacing
export const makeNode = <T extends TestPlan | Suite>(
  data: T[],
  params: TreeBaseFetcherParams
): TreeNodeData<T, LazyNodeProps>[] => {
  return data.map((item) => ({
    id: item.id,
    data: item,
    title: item.name,
    children: [],
    parent: params.parent ? params.parent : null,
    props: {
      canOpen: item.has_children,
      isLeaf: !!item.has_children,
      isLoading: false,
      isChecked: false,
      isHalfChecked: false,
      isMoreLoading: false,
      isOpen: false,
      hasMore: false,
      page: params.page,
      level: params.level,
    },
  }))
}

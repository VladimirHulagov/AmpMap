import Icon from "@ant-design/icons"
import type { CustomIconComponentProps } from "@ant-design/icons/lib/components/Icon"

import { ReactComponent as ListSVG } from "shared/assets/icons/list.svg"

export const ListIcon = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={ListSVG} {...props} />
)

import Icon from "@ant-design/icons"
import type { CustomIconComponentProps } from "@ant-design/icons/lib/components/Icon"

import { ReactComponent as BracesSVG } from "shared/assets/icons/braces.svg"

export const BracesIcon = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={BracesSVG} {...props} />
)

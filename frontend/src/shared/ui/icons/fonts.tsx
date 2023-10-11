import Icon from "@ant-design/icons"
import type { CustomIconComponentProps } from "@ant-design/icons/lib/components/Icon"

import { ReactComponent as FontsSVG } from "shared/assets/icons/fonts.svg"

export const FontsIcon = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={FontsSVG} {...props} />
)

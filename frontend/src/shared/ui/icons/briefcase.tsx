import Icon from "@ant-design/icons"
import type { CustomIconComponentProps } from "@ant-design/icons/lib/components/Icon"
import React from "react"

import { ReactComponent as BriefcaseSVG } from "shared/assets/icons/briefcase.svg"

export const BriefcaseIcon = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={BriefcaseSVG} {...props} />
)

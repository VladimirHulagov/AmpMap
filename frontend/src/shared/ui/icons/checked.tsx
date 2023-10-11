import { CheckOutlined } from "@ant-design/icons"
import React from "react"

interface CheckedIconProps {
  value: boolean
}
export const CheckedIcon = ({ value }: CheckedIconProps) => {
  return value ? <CheckOutlined /> : null
}

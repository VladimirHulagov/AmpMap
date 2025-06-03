import { EllipsisOutlined } from "@ant-design/icons"
import { Dropdown as AntdDropdown } from "antd"
import { SizeType } from "antd/es/config-provider/SizeContext"
import classNames from "classnames"
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react"

import { Button, ButtonProps } from "./button"
import styles from "./styles.module.css"

type DropdownButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> &
  HTMLDataAttribute &
  ButtonProps &
  Omit<React.ComponentProps<(typeof AntdDropdown)["Button"]>, "size"> & {
    size?: ButtonProps["size"]
  }

const SIZE_MAP = {
  s: "small",
  m: "middle",
  l: "large",
  xl: "large",
}

export const DropdownButton = ({
  className,
  size,
  onClick,
  "data-testid": dataTestId,
  ...props
}: DropdownButtonProps) => {
  return (
    <AntdDropdown.Button
      className={classNames({ [styles.dangerDropdown]: props.danger }, className)}
      size={size ? (SIZE_MAP[size] as SizeType) : undefined}
      buttonsRender={() => {
        return [
          <Button
            key="1"
            size={size}
            color={!props.danger ? props.color : "secondary-linear"}
            disabled={props.disabled}
            onClick={onClick}
            data-testid={`${dataTestId}-button-1`}
          >
            {props.children}
          </Button>,
          <Button
            key="2"
            size={size}
            shape="square"
            color={!props.danger ? props.color : "secondary-linear"}
            disabled={props.disabled}
            style={{ borderLeft: 0 }}
            data-testid={`${dataTestId}-button-2`}
          >
            <EllipsisOutlined />
          </Button>,
        ]
      }}
      data-testid={dataTestId}
      {...props}
    />
  )
}

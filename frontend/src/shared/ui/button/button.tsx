import { Button as AntdButton, ButtonProps as AntdButtonProps } from "antd"
import classNames from "classnames"
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react"

import styles from "./styles.module.css"

export type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  shape?: "circle" | "square" | "rect"
  color?:
    | "accent"
    | "accent-linear"
    | "primary"
    | "primary-linear"
    | "secondary"
    | "secondary-linear"
    | "ghost"
  size?: "s" | "m" | "l" | "xl"
  block?: AntdButtonProps["block"]
  loading?: AntdButtonProps["loading"]
  icon?: AntdButtonProps["icon"]
  danger?: AntdButtonProps["danger"]
}

export const Button = ({
  shape = "rect",
  color = "accent",
  size = "m",
  type,
  className,
  ...props
}: ButtonProps) => {
  return (
    <AntdButton
      className={classNames(
        styles.button,
        "y-button",
        {
          "-y-rect": shape === "rect",
          "-y-circle": shape === "circle",
          "-y-square": shape === "square",
          // Colors
          "-y-accent": color === "accent",
          "-y-accent-linear": color === "accent-linear",
          "-y-primary": color === "primary",
          "-y-primary-linear": color === "primary-linear",
          "-y-secondary": color === "secondary",
          "-y-secondary-linear": color === "secondary-linear",
          "-y-ghost": color === "ghost",
          // Sizes
          "-y-size-s": size === "s",
          "-y-size-m": size === "m",
          "-y-size-l": size === "l",
          "-y-size-xl": size === "xl",
          // custom
          [styles.danger]: props.danger,
          [styles.ghostCustom]: color === "ghost",
        },
        className
      )}
      type="primary"
      htmlType={type}
      {...props}
    />
  )
}

import { Flex, Select } from "antd"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { selectThemeType, setThemeType, setThemeValue } from "entities/system/model/slice-theme"

import DarkIcon from "shared/assets/icons/dark.svg?react"
import LightIcon from "shared/assets/icons/light.svg?react"
import SystemThemeIcon from "shared/assets/icons/system-theme.svg?react"

import styles from "./styles.module.css"

const icons = {
  light: <LightIcon width={16} />,
  dark: <DarkIcon width={16} />,
  system: <SystemThemeIcon width={16} />,
}

const options = [
  {
    label: "Light",
    value: "light",
  },
  {
    label: "Dark",
    value: "dark",
  },
  {
    label: "System",
    value: "system",
  },
]

interface Props {
  variant?: "borderless" | "outlined" | "filled"
}

export const ChangeTheme = ({ variant = "outlined" }: Props) => {
  const dispatch = useAppDispatch()
  const themeType = useAppSelector(selectThemeType)

  const handleThemeChange = (newTheme: string[]) => {
    const nextLang = newTheme as unknown as ThemeType
    dispatch(setThemeType(nextLang))
    if (nextLang !== "system") {
      dispatch(setThemeValue(nextLang))
    }
  }

  return (
    <Select
      className={styles.select}
      defaultValue={[themeType]}
      onChange={handleThemeChange}
      options={options}
      variant={variant}
      labelRender={(label) => {
        return (
          <Flex align="center" gap={8} style={{ maxHeight: 22 }}>
            {/* @ts-ignore */}
            <span role="img" aria-label={label.label} className={styles.label}>
              {/* @ts-ignore */}
              {icons[label.value]}
            </span>
            <span>{label.label}</span>
          </Flex>
        )
      }}
      optionRender={(option) => (
        <Flex align="center" gap={8} style={{ maxHeight: 22 }}>
          <span role="img" aria-label={option.data.label} className={styles.label}>
            {/* @ts-ignore */}
            {icons[option.value]}
          </span>
          <span>{option.data.label}</span>
        </Flex>
      )}
    />
  )
}

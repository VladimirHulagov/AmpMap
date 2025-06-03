import { SystemMessages } from "widgets"

import { useAppSelector } from "app/hooks"

import { Auth } from "entities/auth/auth"

import { selectThemeValue } from "entities/system/model/slice-theme"

import { ChangeLang, ChangeTheme } from "features/system"

import LogoDark from "shared/assets/logo/testy-dark.svg?react"
import LogoLight from "shared/assets/logo/testy-light.svg?react"
import { Copyright } from "shared/ui"

import styles from "./styles.module.css"

export const LoginPage = () => {
  const themeValue = useAppSelector(selectThemeValue)

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBlock}>
        <SystemMessages />
      </div>
      <div className={styles.settingsBlock}>
        <ChangeTheme variant="borderless" />
        <ChangeLang variant="borderless" />
      </div>
      <div className={styles.body}>
        {themeValue === "dark" ? (
          <LogoDark className={styles.logo} />
        ) : (
          <LogoLight className={styles.logo} />
        )}
        <div className={styles.form}>
          <Auth />
        </div>
        <Copyright className={styles.footer} />
      </div>
    </div>
  )
}

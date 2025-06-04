import { StyleProvider } from "@ant-design/cssinjs"
import { ConfigProvider } from "antd"
import { ThemeConfig } from "antd/lib"
import en_US from "antd/lib/locale/en_US"
import ru_RU from "antd/lib/locale/ru_RU"
import { PropsWithChildren, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { selectThemeType, setThemeValue } from "entities/system/model/slice-theme"

import { getLang } from "shared/libs/local-storage"

const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "var(--y-color-primary)",
    colorPrimaryHover: "var(--y-color-primary-hover)",
    colorPrimaryBg: "var(--y-color-primary)",
    colorInfo: "var(--y-color-info)",
    colorSuccess: "var(--y-color-success)",
    colorWarning: "var(--y-color-warning)",
    colorError: "var(--y-color-error)",
    colorLink: "var(--y-color-link)",
    colorText: "var(--y-color-text-primary)",
    colorBorder: "var(--y-color-border)",
    colorBorderSecondary: "var(--y-secondary-color-border)",
    colorBgLayout: "var(--y-color-background)",
    colorWhite: "var(--y-grey-0)",
    borderRadius: 2,
    fontFamily: "Inter",
  },
  components: {
    Alert: {
      colorInfo: "var(--y-color-info)",
      colorInfoBg: "var(--y-color-info-container)",
      colorInfoBorder: "var(--y-color-info)",
      colorWarning: "var(--y-color-warning)",
      colorWarningBg: "var(--y-color-warning-container)",
      colorWarningBorder: "var(--y-color-warning)",
      colorError: "var(--y-color-error)",
      colorErrorBg: "var(--y-color-error-container)",
      colorErrorBorder: "var(--y-color-error)",
    },
    Avatar: {
      colorTextPlaceholder: "var(--y-color-scrollbar-thumb)",
    },
    Badge: {
      colorBorderBg: "var(--y-color-border)",
      colorInfo: "var(--y-color-accent)",
      colorError: "var(--y-color-error)",
      colorText: "var(--y-color-text-primary)",
    },
    Breadcrumb: {
      separatorColor: "var(--y-color-divider)",
      lastItemColor: "var(--y-color-accent)",
      itemColor: "var(--y-color-text-primary)",
      linkColor: "var(--y-color-text-primary)",
      linkHoverColor: "var(--y-color-link-hover)",
      colorText: "var(--y-color-text-primary)",
    },
    Button: {
      fontWeight: 600,
      fontSize: 12,
      lineHeight: 16,
      defaultBg: "var(--y-color-secondary)",
      defaultActiveBg: "var(--y-color-secondary-active)",
      defaultHoverBg: "var(--y-color-secondary-hover)",
      defaultColor: "var(--y-color-text-secondary)",
      defaultBorderColor: "var(--y-сolor-secondary-border)",
      defaultHoverColor: "var(--y-color-on-secondary)",
      defaultGhostBorderColor: "transparent",
      defaultGhostColor: "var(--y-color-secondary-inline)",
      dangerColor: "var(--y-color-error)",
    },
    Card: {
      colorBgContainer: "var(--y-secondary-color-background)",
      colorBorderSecondary: "var(--y-color-border)",
    },
    Checkbox: {
      colorBgContainer: "var(--y-color-control-background)",
      colorBorder: "var(--y-color-control-border-hover)",
      colorPrimary: "var(--y-color-accent)",
      colorPrimaryHover: "var(--y-color-accent)",
      colorPrimaryBorder: "var(--y-color-accent)",
    },
    DatePicker: {
      colorBgContainer: "var(--y-color-background)",
      colorBgElevated: "var(--y-color-background)",
      colorBorder: "var(--y-color-control-border)",
      activeBorderColor: "var(--y-color-accent)",
      hoverBorderColor: "var(--y-color-control-border-hover)",
      colorTextPlaceholder: "var(--y-color-control-placeholder)",
      colorPrimary: "var(--y-color-accent)",
      cellHoverBg: "var(--y-color-control-background-hover)",
      cellActiveWithRangeBg: "var(--y-color-datatable-selected-row-background)",
      cellBgDisabled: "var(--y-color-control-background-disabled)",
      colorIcon: "var(--y-color-control-placeholder)",
      colorTextDisabled: "var(--y-color-control-text-disabled)",
    },
    Divider: {
      colorSplit: "var(--y-color-divider)",
    },
    Dropdown: {
      colorBgElevated: "var(--y-color-control-background)",
    },
    Empty: {
      colorTextDescription: "var(--y-color-control-placeholder)",
    },
    Form: {
      verticalLabelPadding: "0 0 5px 0",
      labelColor: "var(--y-color-text-secondary)",
      labelRequiredMarkColor: "var(--y-color-error)",
      colorError: "var(--y-color-error)",
    },
    Input: {
      activeBg: "var(--y-color-control-background)",
      hoverBg: "var(--y-color-control-background-hover)",
      addonBg: "var(--y-color-control-background)",
      colorBorder: "var(--y-color-control-border)",
      colorText: "var(--y-color-control-text)",
      colorTextDisabled: "var(--y-color-control-placeholder)",
      activeBorderColor: "var(--y-color-control-border-focus)",
      hoverBorderColor: "var(--y-color-control-border-hover)",
    },
    Layout: {
      bodyBg: "var(--y-secondary-color-background)",
      footerBg: "var(--y-secondary-color-background)",
    },
    Menu: {
      colorPrimary: "#555",
      itemColor: "#ffffffa6",
      itemBg: "#222",
      itemSelectedBg: "rgba(85, 85, 85, 0.22);",
      itemSelectedColor: "#fff",
      itemHoverColor: "#fff",
      itemHoverBg: "rgba(85, 85, 85, 0.22);",
    },
    Modal: {
      contentBg: "var(--y-color-background)",
      headerBg: "var(--y-color-background)",
      footerBg: "var(--y-color-background)",
      colorIcon: "var(--y-color-secondary-inline)",
    },
    Notification: {
      colorBgElevated: "var(--y-color-control-background)",
      colorIcon: "var(--y-color-secondary-inline)",
    },
    Pagination: {
      itemActiveBg: "var(--y-color-control-background)",
    },
    Popconfirm: {
      colorWarning: "var(--y-color-warning)",
    },
    Popover: {
      colorBgElevated: "var(--y-color-background)",
    },
    Progress: {
      defaultColor: "var(--y-color-accent)",
      colorSuccess: "var(--y-color-active)",
    },
    Radio: {
      colorPrimary: "var(--y-color-accent)",
      colorBgContainer: "var(--y-color-control-background)",
      colorBgContainerDisabled: "var(--y-color-control-background-disabled)",
    },
    Result: {
      colorTextDescription: "var(--y-color-text-secondary)",
    },
    Select: {
      colorBgContainer: "var(--y-color-control-background)",
      colorBgElevated: "var(--y-color-control-background)",
      colorBorder: "var(--y-color-control-border)",
      hoverBorderColor: "var(--y-color-control-border-hover)",
      activeBorderColor: "var(--y-color-control-border-hover)",
      colorTextPlaceholder: "var(--y-color-control-placeholder)",
      colorIcon: "var(--y-color-control-placeholder)",
      colorTextQuaternary: "var(--y-color-control-placeholder)",
      selectorBg: "var(--y-color-control-background)",
      optionActiveBg: "var(--y-color-control-background-hover)",
      optionSelectedBg: "var(--y-color-control-background-hover)",
    },
    Switch: {
      handleSize: 16,
      trackHeight: 24,
      trackPadding: 4,
      colorTextQuaternary: "var(--y-color-secondary)",
      colorTextTertiary: "var(--y-color-secondary-hover)",
      colorPrimary: "var(--y-color-accent)",
      colorPrimaryHover: "var(--y-color-accent-hover)",
      trackHeightSM: 16,
      handleSizeSM: 10,
    },
    Table: {
      colorBgContainer: "var(--y-color-background)",
      headerBg: "var(--y-color-datatable-header-background)",
      borderColor: "var(--y-color-border)",
      colorBorder: "var(--y-color-border)",
      colorBorderBg: "var(--y-color-border)",
      opacityLoading: 1,
    },
    Tabs: {
      inkBarColor: "var(--y-color-accent)",
      itemSelectedColor: "var(--y-color-accent)",
      itemHoverColor: "var(--y-color-accent)",
      colorBorderSecondary: "var(--y-color-divider)",
    },
    Tag: {
      borderRadiusLG: 100,
      borderRadiusSM: 100,
      borderRadiusXS: 100,
      fontSize: 14,
      lineHeight: 16,
      fontWeightStrong: 600,
      defaultBg: "transparent",
    },
    TreeSelect: {
      colorBgElevated: "var(--y-color-control-background)",
    },
    Typography: {
      fontSizeHeading1: 26,
      fontSizeHeading2: 22,
      fontSizeHeading3: 18,
      fontSizeHeading4: 16,
      fontSizeHeading5: 14,
      colorText: "var(--y-color-text-primary)",
      colorLink: "var(--y-color-link)",
      colorLinkHover: "var(--y-color-link-hover)",
    },
  },
}

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const { i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const themeType = useAppSelector(selectThemeType)
  const [locale, setLocale] = useState(getLang() === "en" ? en_US : ru_RU)

  useEffect(() => {
    if (themeType === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light")
      dispatch(setThemeValue(isDark ? "dark" : "light"))
      return
    }

    document.documentElement.setAttribute("data-theme", themeType)
  }, [themeType])

  useEffect(() => {
    if (themeType !== "system") return
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
      const themeFromBrowser = (event.matches ? "dark" : "light") as ThemeValue
      dispatch(setThemeValue(themeFromBrowser))
      document.documentElement.setAttribute("data-theme", themeFromBrowser)
    })
  }, [themeType])

  useEffect(() => {
    if (String(locale) !== i18n.language) {
      setLocale(i18n.language === "en" ? en_US : ru_RU)
    }
  }, [i18n.language])

  return (
    <StyleProvider layer>
      <ConfigProvider theme={themeConfig} locale={locale}>
        {children}
      </ConfigProvider>
    </StyleProvider>
  )
}

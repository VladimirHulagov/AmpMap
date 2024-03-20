import { ConfigProvider } from "antd"
import { ThemeConfig } from "antd/lib"
import { PropsWithChildren } from "react"

const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: "#425cd7",
    colorInfo: "#425cd7",
    colorSuccess: "#4daf7c",
    colorWarning: "#efb622",
    colorError: "#c44d56",
    colorLink: "#425cd7",
    colorText: "#555",
    borderRadius: 4,
  },
  components: {
    Layout: {
      siderBg: "#222",
      triggerBg: "#222",
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
  },
}

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  return <ConfigProvider theme={lightTheme}>{children}</ConfigProvider>
}

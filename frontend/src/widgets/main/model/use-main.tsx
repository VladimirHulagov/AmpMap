import { useState } from "react"

import { useUserConfig } from "entities/user/model"

export const useMain = () => {
  const { userConfig, updateConfig } = useUserConfig()
  const [collapsed, setCollapsed] = useState<boolean>(userConfig.ui.is_open_sidebar)
  const [activeMenu, setActiveMenu] = useState<string[]>([])
  const [openSubMenu, setOpenSubMenu] = useState<string[]>([])

  const onHandleCollapsed = async (toggle: boolean) => {
    setCollapsed(!toggle)

    await updateConfig({
      ui: {
        is_open_sidebar: !toggle,
      },
    })
  }

  return {
    collapsed,
    activeMenu,
    openSubMenu,
    onHandleCollapsed,
    setActiveMenu,
    setOpenSubMenu,
  }
}

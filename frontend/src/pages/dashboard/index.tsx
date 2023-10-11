import React, { useContext, useEffect } from "react"
import { MenuContext } from "widgets"

import { DashboardPageView } from "pages/dashboard/dashboard"

import { MenuContextType } from "widgets/[ui]/main"

export const DashboardPage = () => {
  const { setActiveMenu } = useContext(MenuContext) as MenuContextType

  useEffect(() => {
    setActiveMenu(["dashboard"])
  }, [])

  return <DashboardPageView />
}

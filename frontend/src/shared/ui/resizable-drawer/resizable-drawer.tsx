import { MoreOutlined } from "@ant-design/icons"
import { Drawer, DrawerProps } from "antd"
import { PropsWithChildren, useCallback, useEffect, useState } from "react"

import { useUserConfig } from "entities/user/model"

import styles from "./styles.module.css"

let isResizing = false
const DEFAULT_WIDTH = 500
const MIN_WIDTH = 500

const getDrawerMaxWidth = (width: number) => Math.min(width, document.body.clientWidth - 100)

interface ResizableDrawer extends DrawerProps {
  drawerKey: "test_case_details" | "test_result_details"
}

export const ResizableDrawer = ({
  children,
  drawerKey,
  ...props
}: PropsWithChildren<ResizableDrawer>) => {
  const { userConfig, updateConfig } = useUserConfig()
  const [drawerWidth, setDrawerWidth] = useState(
    getDrawerMaxWidth(userConfig.ui[`drawer_size_${drawerKey}`] ?? DEFAULT_WIDTH)
  )

  const handleMouseup = async () => {
    if (!isResizing) {
      return
    }

    isResizing = false

    document.removeEventListener("mousemove", cbHandleMouseMove)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    document.removeEventListener("mouseup", cbHandleMouseUp)

    await updateConfig({
      ui: {
        ...userConfig.ui,
        [`drawer_size_${drawerKey}`]: drawerWidth,
      },
    })
  }

  const handleMousedown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    document.addEventListener("mousemove", cbHandleMouseMove)
    isResizing = true
  }

  const handleMousemove = (e: MouseEvent) => {
    const offsetRight = document.body.offsetWidth - (e.clientX - document.body.offsetLeft)
    const maxWidth = getDrawerMaxWidth(1600)
    if (offsetRight > MIN_WIDTH && offsetRight < maxWidth) {
      setDrawerWidth(offsetRight)
    }
  }

  const cbHandleMouseMove = useCallback(handleMousemove, [])
  const cbHandleMouseUp = useCallback(handleMouseup, [drawerWidth])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    document.addEventListener("mouseup", cbHandleMouseUp)

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      document.removeEventListener("mouseup", cbHandleMouseUp)
    }
  }, [cbHandleMouseUp])

  return (
    <Drawer
      {...props}
      width={drawerWidth}
      className="testy-drawer"
      contentWrapperStyle={{
        transition: "all 0.2s",
      }}
    >
      <div className={styles.resizerBlock} onMouseDown={handleMousedown}>
        <div className={styles.resizerBtn}>
          <MoreOutlined />
        </div>
        <div className={styles.resizerLine} />
      </div>
      {children}
    </Drawer>
  )
}

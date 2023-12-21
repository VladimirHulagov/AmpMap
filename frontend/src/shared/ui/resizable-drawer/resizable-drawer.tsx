import { MoreOutlined } from "@ant-design/icons"
import { Drawer, DrawerProps } from "antd"
import { PropsWithChildren, useCallback, useState } from "react"

import { useUserConfig } from "entities/user/model"

import styles from "./styles.module.css"

let isResizing = false

const getDrawerMaxWidth = (width: number) => Math.min(width, document.body.clientWidth - 100)

interface ResizableDrawer extends DrawerProps {
  drawerKey: "test_case_details" | "test_result_details"
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ResizableDrawer = ({
  children,
  drawerKey,
  ...props
}: PropsWithChildren<ResizableDrawer>) => {
  const { userConfig, updateConfig } = useUserConfig()
  const [drawerWidth, setDrawerWidth] = useState(
    getDrawerMaxWidth(userConfig.ui[`drawer_size_${drawerKey}`] || 500)
  )

  const cbHandleMouseMove = useCallback(handleMousemove, [])
  const cbHandleMouseUp = useCallback(handleMouseup, [drawerWidth])

  async function handleMouseup() {
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

  function handleMousedown(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()

    document.addEventListener("mousemove", cbHandleMouseMove)
    isResizing = true
  }

  function handleMousemove(e: MouseEvent) {
    const offsetRight = document.body.offsetWidth - (e.clientX - document.body.offsetLeft)
    const minWidth = 300
    const maxWidth = getDrawerMaxWidth(1600)
    if (offsetRight > minWidth && offsetRight < maxWidth) {
      setDrawerWidth(offsetRight)
    }
  }

  return (
    <Drawer
      {...props}
      width={drawerWidth}
      contentWrapperStyle={{
        transition: "all 0.2s",
      }}
    >
      <div
        className={styles.resizerBlock}
        onMouseDown={handleMousedown}
        onMouseUp={cbHandleMouseUp}
      >
        <div className={styles.resizerBtn}>
          <MoreOutlined />
        </div>
        <div className={styles.resizerLine} />
      </div>
      {children}
    </Drawer>
  )
}

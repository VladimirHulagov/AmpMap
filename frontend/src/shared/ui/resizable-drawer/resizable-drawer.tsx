import { MoreOutlined } from "@ant-design/icons"
import { Drawer, DrawerProps } from "antd"
import { PropsWithChildren, useCallback, useEffect, useState } from "react"

import { useUserConfig } from "entities/user/model"

import { useDebounce } from "shared/hooks/use-debounce"

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
  const [drawerWidth, setDrawerWidth] = useState<string | number | undefined>(
    getDrawerMaxWidth(userConfig.ui[`drawer_size_${drawerKey}`] || 500)
  )
  const debDrawerWidth = useDebounce(drawerWidth, 500, true)

  const cbHandleMouseMove = useCallback(handleMousemove, [])
  const cbHandleMouseUp = useCallback(handleMouseup, [])

  useEffect(() => {
    const update = async () => {
      await updateConfig({
        ui: {
          ...userConfig.ui,
          [`drawer_size_${drawerKey}`]: drawerWidth,
        },
      })
    }

    update()
  }, [debDrawerWidth])

  async function handleMouseup() {
    if (!isResizing) {
      return
    }

    isResizing = false
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    document.removeEventListener("mousemove", cbHandleMouseMove)
    document.removeEventListener("mouseup", cbHandleMouseUp)
  }

  function handleMousedown(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation()
    e.preventDefault()

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    document.addEventListener("mousemove", cbHandleMouseMove)
    document.addEventListener("mouseup", cbHandleMouseUp)
    isResizing = true
  }

  function handleMousemove(e: React.MouseEvent<HTMLElement>) {
    const offsetRight = document.body.offsetWidth - (e.clientX - document.body.offsetLeft)
    const minWidth = 300
    const maxWidth = getDrawerMaxWidth(1600)
    if (offsetRight > minWidth && offsetRight < maxWidth) {
      setDrawerWidth(offsetRight)
    }
  }

  return (
    <Drawer {...props} width={drawerWidth}>
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

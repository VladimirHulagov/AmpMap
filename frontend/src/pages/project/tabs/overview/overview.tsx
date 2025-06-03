import { Divider, Flex } from "antd"
import { useRef } from "react"

import { useResizebleBlock } from "shared/hooks"
import { LineDivider } from "shared/ui"

import {
  ProjectAssignedToMeOverview,
  ProjectSettingsOverview,
  ProjectStatusesOverview,
  ProjectTestsProgressBlock,
} from "widgets/project/ui"

import styles from "./styles.module.css"

export const ProjectOverviewTabPage = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const elRef = useRef<HTMLDivElement>(null)
  const { width, handleMouseDown, focus } = useResizebleBlock({
    key: "project-overview-tab",
    elRef,
    containerRef,
    defaultWidth: 900,
    minWidth: 500,
    maxWidth: 500,
    maxAsPercent: true,
    direction: "right",
  })

  const isColumn = width < 900

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <Flex vertical ref={elRef} style={{ width }}>
        <div
          style={{
            display: "flex",
            flexDirection: isColumn ? "column" : "row",
          }}
        >
          <ProjectSettingsOverview />
          <Divider
            type={isColumn ? "horizontal" : "vertical"}
            style={{
              height: isColumn ? "auto" : "100%",
              margin: isColumn ? "16px 0" : "0 32px",
            }}
          />
          <ProjectStatusesOverview />
        </div>
        <ProjectTestsProgressBlock />
      </Flex>
      <LineDivider onMouseDown={handleMouseDown} focus={focus} style={{ marginInline: 32 }} />
      <ProjectAssignedToMeOverview />
    </div>
  )
}

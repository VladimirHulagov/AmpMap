import cn from "classnames"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import styles from "./line-statistic-legend.module.css"
import { Item, StatisticLineProps } from "./line-statistic.types"

const GAP = 16

interface LineStatisticLegendItemProps {
  item: Item
  total: number
}

export const LineStatisticLegendItem = ({ item, total }: LineStatisticLegendItemProps) => {
  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(2) : "0"

  return (
    <div data-testid={`statistic-line-legend-item-${item.label}`}>
      <div className={styles.legendItem}>
        <div className={styles.colorBoxWrapper}>
          <div className={styles.colorBox} style={{ backgroundColor: item.color }} />
          <span className={styles.label}>{item.label}</span>
        </div>
        <span className={styles.value}>
          <strong>{item.value}</strong> <span className={styles.percentage}>({percentage}%)</span>
        </span>
      </div>
    </div>
  )
}

export const LineStatisticLegend = ({ items }: StatisticLineProps) => {
  const { t } = useTranslation()
  const total = items.reduce((sum, item) => sum + item.value, 0)

  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenMeasurerRef = useRef<HTMLDivElement>(null)

  const [itemWidths, setItemWidths] = useState<number[]>([])
  const [maxVisible, setMaxVisible] = useState(items.length)
  const [expanded, setExpanded] = useState(false)

  useLayoutEffect(() => {
    if (!hiddenMeasurerRef.current) return
    const children = hiddenMeasurerRef.current.children
    if (children.length !== items.length) return
    const widths = Array.from(children).map((child) => (child as HTMLElement).offsetWidth)
    setItemWidths(widths)
  }, [items])

  const recalcVisibleItems = () => {
    if (!containerRef.current) return
    if (itemWidths.length !== items.length) return

    const containerWidth = containerRef.current.clientWidth - 120
    let totalWidth = 0
    let count = 0

    for (const itemWidth of itemWidths) {
      if (totalWidth + itemWidth <= containerWidth) {
        totalWidth += itemWidth + GAP
        count++
      } else {
        break
      }
    }

    setMaxVisible(count)
    if (count < items.length) {
      setExpanded((prev) => prev)
    } else {
      setExpanded(false)
    }
  }

  useEffect(() => {
    recalcVisibleItems()
  }, [itemWidths])

  useEffect(() => {
    const containerEl = containerRef.current
    if (!containerEl) return

    const resizeObserver = new ResizeObserver(recalcVisibleItems)
    resizeObserver.observe(containerEl)

    return () => {
      resizeObserver.disconnect()
    }
  }, [recalcVisibleItems])

  const handleToggleExpand = () => {
    setExpanded((prev) => !prev)
  }

  const visibleItems = expanded ? items : items.slice(0, maxVisible)
  const isOverflowed = maxVisible < items.length
  const btnText = expanded ? t("Show Less") : `${t("Show All")} (+${items.length - maxVisible})`

  return (
    <>
      <div className={styles.hiddenMeasurer} ref={hiddenMeasurerRef}>
        {items.map((item, index) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(2) : "0"

          return (
            <div key={index} className={styles.hiddenItem}>
              <div className={styles.legendItem}>
                <div className={styles.colorBox} style={{ backgroundColor: item.color }} />
                <span className={styles.label}>{item.label}</span>
                <span className={styles.value}>
                  <strong>{item.value}</strong> ({percentage}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div
        ref={containerRef}
        className={cn(styles.container, { [styles.containerExpanded]: expanded })}
      >
        {visibleItems.map((item, index) => (
          <LineStatisticLegendItem key={index} item={item} total={total} />
        ))}
        {isOverflowed && (
          <button
            className={styles.toggleButton}
            onClick={handleToggleExpand}
            data-testid="statistic-line-legend-toggle-button"
          >
            {btnText}
          </button>
        )}
      </div>
    </>
  )
}

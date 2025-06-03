import classNames from "classnames"
import {
  CSSProperties,
  ForwardedRef,
  ReactElement,
  RefObject,
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"

import { Label } from "entities/label/ui/label"
import { SkeletonLabelFilter } from "entities/label/ui/label-filter/skeleton-label-filter"

import { colors } from "shared/config"

import styles from "./styles.module.css"

interface Props {
  children: ReactElement[]
  isLoading?: boolean
  id: string
  showMore?: {
    text: string
    styles?: CSSProperties
  }
  rowCount?: number
  counterCls?: string
  showCount?: boolean
}

const getCountContainedElements = (
  listRef: RefObject<HTMLUListElement>,
  counterRef: RefObject<HTMLLIElement>,
  prevValue: number,
  rowCount: number
) => {
  if (!listRef.current || !counterRef.current) {
    return prevValue
  }

  const gap = 8
  const items = listRef.current.children

  let currentWidth = counterRef.current?.clientWidth ?? 0
  let count = 0

  for (const index in items) {
    const item = items[index]

    if (item.id === "counter") {
      continue
    }

    if (currentWidth + item.clientWidth + gap >= listRef.current?.clientWidth * rowCount) {
      break
    }

    currentWidth += item.clientWidth + gap

    count++
  }

  return count
}

export const LabelList = ({
  children,
  id,
  isLoading,
  showMore,
  rowCount = 2,
  showCount,
  counterCls,
}: Props) => {
  const { t } = useTranslation()
  const listRef = useRef<HTMLUListElement>(null)
  const counterRef = useRef<HTMLLIElement>(null)
  const [showAll, setShowAll] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [counterIndex, setCounterIndex] = useState(0)

  const handleShowMore = () => {
    setShowAll(true)
    setIsOverflowing(false)
  }

  useLayoutEffect(() => {
    if (!listRef.current || !children.length) {
      return
    }

    const handleResize = () => {
      setIsOverflowing(listRef.current!.scrollHeight > rowCount * 26) // 26px = one row

      if (showCount) {
        setCounterIndex((prevState) => {
          return getCountContainedElements(listRef, counterRef, prevState, rowCount)
        })
      }
    }

    handleResize()

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(listRef.current)

    return () => resizeObserver.disconnect()
  }, [children, showCount, showAll, isOverflowing])

  if (isLoading) {
    return (
      <div style={{ marginTop: 8 }}>
        <SkeletonLabelFilter />
      </div>
    )
  }

  if (!children.length) {
    return <span className={styles.noData}>{t("No labels")}</span>
  }

  return (
    <>
      <ul
        ref={listRef}
        id={id}
        className={classNames(styles.list, { [styles.maxSize]: showAll })}
        data-testid={id}
        style={{ maxHeight: rowCount * 26 }}
      >
        {showCount && isOverflowing && !showAll
          ? [
              ...children.slice(0, counterIndex),
              <Counter
                key="counter"
                ref={counterRef}
                count={children.length - counterIndex}
                onClick={() => setShowAll(true)}
                cls={counterCls}
              />,
              ...children.slice(counterIndex).map((item, index) => (
                <div key={`hidden-${index}`} style={{ opacity: 0 }}>
                  {item}
                </div>
              )),
            ]
          : children}
      </ul>
      {isOverflowing && !showAll && (
        <button
          type="button"
          className={styles.showButton}
          onClick={handleShowMore}
          data-testid={`${id}-show-more`}
          style={showMore?.styles}
        >
          {showMore?.text}
        </button>
      )}
      {isOverflowing && showAll && (
        <button
          type="button"
          className={styles.showButton}
          onClick={() => setShowAll(false)}
          data-testid={`${id}-show-less`}
        >
          {t("Show less")}
        </button>
      )}
    </>
  )
}

interface CounterProps {
  count: number
  cls?: string
  onClick: () => void
}

// eslint-disable-next-line react/display-name
const Counter = forwardRef(
  ({ cls, onClick, count }: CounterProps, ref: ForwardedRef<HTMLLIElement>) => (
    <li id="counter" ref={ref}>
      <Label content={`+${count}`} color={colors.untested} className={cls} onClick={onClick} />
    </li>
  )
)

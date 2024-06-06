import { useEffect, useRef, useState } from "react"

export const useIsDirtyWithArrayField = <T>(
  dirtyFieldsKeys: string[],
  skipFieldName: string,
  skippedValue: T[]
) => {
  const [isDirty, setIsDirty] = useState(false)
  const isInit = useRef(false)

  useEffect(() => {
    if (isDirty) return

    const isNonArrayFieldDirty = dirtyFieldsKeys.some((key) => key !== skipFieldName)
    if (isNonArrayFieldDirty) {
      setIsDirty(true)
    }
  }, [dirtyFieldsKeys, skipFieldName])

  useEffect(() => {
    if (!isInit.current) {
      isInit.current = true
      return
    }

    setIsDirty(true)
  }, [skippedValue])

  return isDirty
}

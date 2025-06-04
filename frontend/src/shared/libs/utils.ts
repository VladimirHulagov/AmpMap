import { UploadFile } from "antd/lib/upload"
import i18n from "i18next"

import { antdNotification } from "./antd-modals/antd-modals"

export const getNumberToFixed = (value: number, fixed: number) => {
  return Number(value.toFixed(fixed))
}

export const fileReader = async (file: UploadFile<unknown>) => {
  const imgUrl: string = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file.originFileObj as Blob)
    reader.onload = () => resolve(String(reader.result))
  })

  return {
    url: imgUrl,
    file: file.originFileObj,
  }
}

export const initInternalError = (err: unknown) => {
  console.error(err)
  antdNotification.error("init-internal-error", {
    description: i18n.t("Internal server error. Showing in console log."),
  })
}

export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function providesList<R extends Record<string, any>[], T extends string>(
  results: R | undefined,
  tagType: T,
  field = "id"
) {
  return results
    ? [
        { type: tagType, id: "LIST" },
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...results.map((data) => ({ type: tagType, id: data[field] })),
      ]
    : [{ type: tagType, id: "LIST" }]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function invalidatesList<R extends Record<string, any>, T extends string>(
  result: R | undefined | void,
  tagType: T,
  field = "id"
): {
  type: T
  id: number | string
}[] {
  return result
    ? [
        { type: tagType, id: "LIST" },
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        { type: tagType, id: result[field] },
      ]
    : [{ type: tagType, id: "LIST" }]
}

export const exists2dArray = <T>(arr: T[][], search: T) => {
  return arr.some((row) => row.includes(search))
}

export const find2dItemByCoords = <T>(arr: T[][], coords: [number, number]) => {
  const [x, y] = coords
  return arr[y]?.[x]
}

export const remove2dItemByCoords = <T>(arr: T[][], coords: [number, number]) => {
  const [x, y] = coords
  arr[y]?.splice(x, 1)
  return arr
}

export const add2dItemByCoords = <T>(arr: T[][], coords: [number, number], item: T): T[][] => {
  const [x, y] = coords
  arr[y]?.splice(x, 0, item)
  return arr
}

export const objectToJSON = (target: object) => {
  let cache: unknown[] | null = []
  const str = JSON.stringify(target, function (_, value) {
    if (typeof value === "object" && value !== null) {
      if (cache?.indexOf(value) !== -1) {
        return
      }
      cache.push(value)
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value
  })
  cache = null
  return str
}

export const toBool = (value: string) => (value === "true" ? true : false)

export const clearObjectByKeys = (target: Record<string, unknown>, cachedKeys: string[]) => {
  const t = { ...target }
  Object.keys(t).forEach((key) => {
    if (!cachedKeys.includes(key)) {
      // @ts-ignore
      delete t[key]
    }
  })
  return t
}

export const clearObject = (obj: Record<string, unknown>) => {
  const copyObj = { ...obj }
  for (const key in copyObj) {
    if (copyObj[key] === undefined || copyObj[key] === null || copyObj[key] === "") {
      delete copyObj[key]
    }
  }
  return copyObj
}

export const formatStringToStringArray = (value: string) =>
  value.split(",").filter((item) => item.length)
export const formatStringToNumberArray = (value: string) =>
  formatStringToStringArray(value).map(Number)

export const createConcatIdsFn = (title: string) => {
  return (id: string) => `${title}-${id}`
}

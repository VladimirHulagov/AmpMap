import { notification } from "antd"
import { UploadFile } from "antd/lib/upload"

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
  notification.error({
    message: "Error!",
    description: "Internal server error. Showing in console log.",
  })
}

export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

export const sortEstimate = (a?: string, b?: string) => {
  if (!a || !b) return 0

  const aNumber = Number(a?.slice(0, -1))
  const bNumber = Number(b?.slice(0, -1))
  const aLetter = a?.slice(-1)
  const bLetter = b?.slice(-1)

  if (aLetter === bLetter) {
    return aNumber - bNumber
  }

  const order = ["m", "h", "d"]
  return order.indexOf(aLetter) - order.indexOf(bLetter)
}

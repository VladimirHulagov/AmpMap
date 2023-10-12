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

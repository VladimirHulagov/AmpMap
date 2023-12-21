/* eslint-disable @typescript-eslint/prefer-for-of */

export const makeAttributesJson = (attributes: Attribute[]) => {
  const attributesJson: Record<string, string[] | string | object> = {}
  let isSuccess = true
  let error: string | null = null

  for (let i = 0; i < attributes.length; i++) {
    const name = attributes[i].name.trimStart().trimEnd()
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const value = attributes[i].value.toString()
    const type = attributes[i].type

    if (name === "" || value === "") {
      error = "All fields are required"
      isSuccess = false
      break
    }

    if (type === "json") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        attributesJson[name] = JSON.parse(value)
      } catch (err: unknown) {
        const errorData = err as Error
        error = errorData.message
        isSuccess = false
        break
      }
    } else if (type === "list") {
      attributesJson[name] = value.split(/\r?\n/)
    } else if (type === "txt") {
      attributesJson[name] = attributes[i].value
    }
  }

  return { attributesJson, isSuccess, error }
}

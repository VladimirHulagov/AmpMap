/* eslint-disable @typescript-eslint/prefer-for-of */

export const makeAttributesJson = (attributes: Attribute[]) => {
  const attributesJson: AttributesObject = {}
  let isSuccess = true
  let error: string | null = null

  for (let i = 0; i < attributes.length; i++) {
    const name = attributes[i].name.trimStart().trimEnd()
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const value = attributes[i].value.toString()
    const type = attributes[i].type
    const isRequired = !!attributes[i].required

    if (name === "" || (value === "" && isRequired)) {
      error = "All fields are required"
      isSuccess = false
      break
    }

    if (type === "JSON") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        attributesJson[name] = JSON.parse(value)
      } catch (err: unknown) {
        const errorData = err as Error
        error = errorData.message
        isSuccess = false
        break
      }
    } else if (type === "List") {
      attributesJson[name] = value.split(/\r?\n/)
    } else if (type === "Text") {
      attributesJson[name] = attributes[i].value
    }
  }

  return { attributesJson, isSuccess, error }
}

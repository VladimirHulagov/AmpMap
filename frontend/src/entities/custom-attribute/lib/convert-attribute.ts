import { customAttributesObject } from "shared/config/custom-attribute-types"

export const convertAttribute = (customAttribute: CustomAttribute): Attribute => ({
  id: String(customAttribute.id),
  name: customAttribute.name,
  type: customAttributesObject[customAttribute.type],
  value: "",
  required: customAttribute.is_required,
  status_specific: customAttribute.status_specific ?? [],
})

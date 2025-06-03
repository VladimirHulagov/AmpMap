import commonEN from "shared/locales/en/common.json"
import entitiesEN from "shared/locales/en/entities.json"
import commonRU from "shared/locales/ru/common.json"
import entitiesRU from "shared/locales/ru/entities.json"
import translationRU from "shared/locales/ru/ru.json"

const genByKeys = <T extends Record<string, string>>(ruData: T): T => {
  const en = {}
  Object.keys(ruData).forEach((key) => {
    // @ts-ignore
    en[key] = key
  })
  // @ts-ignore
  return en
}

export const i18nConfig = {
  en: {
    translation: genByKeys(translationRU),
    common: commonEN,
    entities: entitiesEN,
  },
  ru: {
    translation: translationRU,
    common: commonRU,
    entities: entitiesRU,
  },
}

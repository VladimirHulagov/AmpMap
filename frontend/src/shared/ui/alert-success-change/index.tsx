import { useTranslation } from "react-i18next"

interface Props extends HTMLDataAttribute {
  link?: string
  title: string
  id: string
  action: "updated" | "created" | "deleted" | "archived" | "added" | "copied" | "restore"
}

export const AlertSuccessChange = ({ action, id, link, title, ...props }: Props) => {
  const { t } = useTranslation()
  return (
    <span {...props}>
      {title} {link ? <a href={link}>{id}</a> : id} {t(action)} {t("successfully")}
    </span>
  )
}

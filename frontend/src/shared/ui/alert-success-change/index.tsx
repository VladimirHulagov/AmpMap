interface Props {
  link?: string
  title: string
  id: string
  action: "updated" | "created" | "deleted" | "archived" | "added" | "copied" | "restore"
}

export const AlertSuccessChange = ({ action, id, link, title }: Props) => {
  return (
    <span>
      {title} {link ? <a href={link}>{id}</a> : id} {action} successfully
    </span>
  )
}

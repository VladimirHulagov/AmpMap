import { Tag } from "antd"

type StatusProps = Pick<Status, "id" | "color" | "name">

export const Status = ({ id, name, color }: StatusProps) => {
  return (
    <Tag className="status" color={color} id={`status-${name}-${id}`}>
      {name.toUpperCase()}
    </Tag>
  )
}

export const UntestedStatus = () => {
  return (
    <Tag className="status" color="default" id="status-untested">
      UNTESTED
    </Tag>
  )
}

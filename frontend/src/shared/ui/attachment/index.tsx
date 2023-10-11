import { AttachmentField } from "./field"
import { AttachmentItem } from "./item"
import { AttachmentList } from "./list"

const Attachment = ({ children }: { children: React.ReactNode }) => <>{children}</>

Attachment.Field = AttachmentField
Attachment.Item = AttachmentItem
Attachment.List = AttachmentList

export { Attachment }

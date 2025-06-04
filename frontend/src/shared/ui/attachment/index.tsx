import { AddAttachmentButton } from "./add-button"
import { AttachmentDropFiles } from "./drop-files"
import { AttachmentDropFilesMin } from "./drop-files-min/drop-files-min"
import { AttachmentField } from "./field"
import { AttachmentItem } from "./item/item"
import { AttachmentList } from "./list"

const Attachment = ({ children }: { children: React.ReactNode }) => <>{children}</>

Attachment.Field = AttachmentField
Attachment.Item = AttachmentItem
Attachment.List = AttachmentList
Attachment.DropFiles = AttachmentDropFiles
Attachment.DropFilesMin = AttachmentDropFilesMin
Attachment.AddButton = AddAttachmentButton

export { Attachment }

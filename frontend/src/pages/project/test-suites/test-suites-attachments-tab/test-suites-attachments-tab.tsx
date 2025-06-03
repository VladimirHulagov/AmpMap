import { Attachment } from "shared/ui"

import { useTestSuiteContext } from "../test-suite-layout/test-suite-layout"

export const TestSuitesAttachmentsTab = () => {
  const { suite } = useTestSuiteContext()
  return (
    <Attachment.Field attachments={suite?.attachments ?? []} isDivider={false} isShowNoAttachment />
  )
}

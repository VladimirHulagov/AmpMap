interface SortingStep {
  sort_order: number
}

export const sortingSteps = <T extends SortingStep>(steps: T[]): T[] => {
  const sortList = steps.sort((a: T, b: T) => a.sort_order - b.sort_order)

  return sortList.map((step, index) => ({
    ...step,
    sort_order: index + 1,
  }))
}

export const formattingAttachmentForSteps = ({
  id,
  name,
  scenario,
  expected,
  sort_order,
  attachments: attachmentsArgs,
  isNew,
}: StepAttachNumber) => ({
  id: isNew ? undefined : id,
  name,
  scenario,
  expected,
  sort_order,
  attachments: attachmentsArgs.map((x: number | IAttachment) => {
    if (typeof x === "object") return x.id
    return x
  }),
  isNew,
})

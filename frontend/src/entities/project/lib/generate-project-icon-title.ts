export const generateProjectIconTitle = (fullName: string) => {
  const firstLetterSplit = fullName.split(" ").map((el) => el.slice(0, 1).toUpperCase())
  return firstLetterSplit.splice(0, 3).join("")
}

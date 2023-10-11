export const savePrevPageUrl = (url: string) => {
  localStorage.setItem("prevPageUrl", url)
}

export const getPrevPageUrl = () => {
  return localStorage.getItem("prevPageUrl")
}

export const clearPrevPageUrl = () => {
  localStorage.removeItem("prevPageUrl")
}

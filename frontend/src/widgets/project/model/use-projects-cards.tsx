import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"

import { useLazyGetProjectsQuery } from "entities/project/api"

import { useUserConfig } from "entities/user/model"

export const useProjectsCards = () => {
  const { userConfig, updateConfig } = useUserConfig()
  const { ref, inView } = useInView({
    threshold: 0,
    trackVisibility: true,
    delay: 100,
  })
  const [paginationParams, setPagingationParams] = useState({ page: 1, page_size: 10 })
  const [projects, setProjects] = useState<Project[]>([])
  const [isLastPage, setIsLastPage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [getProjects] = useLazyGetProjectsQuery()

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      const { results, pages } = await getProjects({
        is_archive: userConfig.projects.is_show_archived,
        favorites: userConfig.projects.is_only_favorite ?? false,
        ...paginationParams,
      }).unwrap()
      setProjects((prevState) => [...prevState, ...results])
      if (!pages.next) {
        setIsLastPage(true)
      }
      setIsLoading(false)
    }

    fetch()
  }, [userConfig.projects.is_only_favorite, userConfig.projects.is_show_archived, paginationParams])

  useEffect(() => {
    if (!inView || isLoading || isLastPage) return
    setPagingationParams({ page: paginationParams.page + 1, page_size: paginationParams.page_size })
  }, [inView, isLoading, isLastPage])

  const handleClear = () => {
    setPagingationParams({ page: 1, page_size: paginationParams.page_size })
    setProjects([])
    setIsLastPage(false)
  }

  const onShowArchived = async () => {
    handleClear()
    await updateConfig({
      ...userConfig,
      projects: {
        ...userConfig.projects,
        is_show_archived: !userConfig.projects.is_show_archived,
      },
    })
  }

  const onIsOnlyFavoriteClick = async () => {
    handleClear()
    await updateConfig({
      ...userConfig,
      projects: {
        ...userConfig.projects,
        is_only_favorite: !userConfig.projects.is_only_favorite,
      },
    })
  }

  return {
    projects,
    isLoading,
    isLastPage,
    onIsOnlyFavoriteClick,
    onShowArchived,
    bottomRef: ref,
  }
}

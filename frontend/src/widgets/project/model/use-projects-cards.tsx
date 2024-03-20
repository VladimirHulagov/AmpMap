import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"

import { useLazyGetProjectsQuery } from "entities/project/api"

import { useUserConfig } from "entities/user/model"

interface RequestParams {
  page: number
  page_size: number
  is_archive?: boolean
  favorites?: boolean
}

export const useProjectsCards = () => {
  const { userConfig, updateConfig } = useUserConfig()
  const [paginationParams, setPagingationParams] = useState({ page: 1, page_size: 10 })
  const [projects, setProjects] = useState<Project[]>([])
  const [isLastPage, setIsLastPage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [getProjects] = useLazyGetProjectsQuery()

  const { ref, inView } = useInView({
    threshold: 0,
    trackVisibility: true,
    delay: 100,
    skip: isLoading || isLastPage,
  })

  const fetchData = async (params: RequestParams) => {
    try {
      setIsLoading(true)
      const { results, pages } = await getProjects(params).unwrap()
      setProjects((prevState) => [...prevState, ...results])
      setIsLastPage(!pages.next)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!inView || isLoading || isLastPage) return
    setPagingationParams((prevState) => {
      fetchData({
        page: prevState.page + 1,
        page_size: prevState.page_size,
        is_archive: userConfig.projects.is_show_archived,
        favorites: userConfig.projects.is_only_favorite ?? false,
      })

      return {
        page: prevState.page + 1,
        page_size: prevState.page_size,
      }
    })
  }, [inView, isLoading, isLastPage])

  useEffect(() => {
    setPagingationParams((prevState) => {
      fetchData({
        page: 1,
        page_size: prevState.page_size,
        is_archive: userConfig.projects.is_show_archived,
        favorites: userConfig.projects.is_only_favorite ?? false,
      })

      return {
        page: 1,
        page_size: prevState.page_size,
      }
    })
  }, [userConfig.projects.is_only_favorite, userConfig.projects.is_show_archived])

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

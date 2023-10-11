import { useEffect, useState } from "react"

import { useUserConfig } from "entities/user/model"

import { useLazyGetProjectsQuery } from "../api"

interface UseProjectsCardsReturn {
  onFavoriteClick: (projectId: number) => Promise<void>
  onIsOnlyFavoriteClick: () => Promise<void>
  onShowArchived: () => Promise<void>
  projects: IProject[]
  isLoading: boolean
}

export const useProjectsCards = (): UseProjectsCardsReturn => {
  const { userConfig, updateConfig } = useUserConfig()
  const [visibleProjects, setVisibleProjects] = useState<IProject[]>([])

  const [getProjects, { data: projects, isLoading }] = useLazyGetProjectsQuery()

  useEffect(() => {
    getProjects(userConfig.projects.is_show_archived)
  }, [userConfig.projects.is_show_archived])

  useEffect(() => {
    if (!projects) return
    updateVisibleProjects()
  }, [projects, userConfig.projects.is_only_favorite])

  const updateVisibleProjects = () => {
    if (!projects) return
    const favoriteProjects = projects.filter((project) =>
      userConfig.projects.favorite.some((i) => i === project.id)
    )
    const unFavoriteProjects = projects.filter(
      (project) => !userConfig.projects.favorite.some((i) => i === project.id)
    )

    const sortedProjects = favoriteProjects.length
      ? [...favoriteProjects, ...unFavoriteProjects]
      : projects
    setVisibleProjects(!userConfig.projects.is_only_favorite ? sortedProjects : favoriteProjects)
  }

  const onShowArchived = async () => {
    await updateConfig({
      ...userConfig,
      projects: {
        ...userConfig.projects,
        is_show_archived: !userConfig.projects.is_show_archived,
      },
    })
  }

  const onIsOnlyFavoriteClick = async () => {
    await updateConfig({
      ...userConfig,
      projects: {
        ...userConfig.projects,
        is_only_favorite: !userConfig.projects.is_only_favorite,
      },
    })
  }

  const onFavoriteClick = async (projectId: number) => {
    const isNew = !userConfig.projects.favorite.some((i) => i === projectId)

    const newProjectIds = isNew
      ? userConfig.projects.favorite.concat([projectId])
      : userConfig.projects.favorite.filter((i) => Number(i) !== Number(projectId))

    const newConfig = {
      ...userConfig,
      projects: {
        ...userConfig.projects,
        favorite: newProjectIds,
      },
    }

    await updateConfig(newConfig)
  }

  return {
    onFavoriteClick,
    onIsOnlyFavoriteClick,
    onShowArchived,
    projects: visibleProjects,
    isLoading,
  }
}

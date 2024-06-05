import { StarFilled, StarOutlined } from "@ant-design/icons"

import { useUserConfig } from "entities/user/model"

import { colors } from "shared/config"

export const FolowProject = ({ project }: { project: Project }) => {
  const { userConfig, updateConfig } = useUserConfig()

  const handleFavoriteClick = async () => {
    if (!project.is_visible) {
      return
    }
    const isNew = !userConfig.projects.favorite.some((i) => i === project.id)

    const newProjectIds = isNew
      ? userConfig.projects.favorite.concat([project.id])
      : userConfig.projects.favorite.filter((i) => Number(i) !== Number(project.id))

    const newConfig = {
      ...userConfig,
      projects: {
        ...userConfig.projects,
        favorite: newProjectIds,
      },
    }

    await updateConfig(newConfig)
  }

  return (
    <div
      id={`${project.name}-project-favorite-btn`}
      style={{
        cursor: "pointer",
        width: 50,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={handleFavoriteClick}
    >
      {!userConfig?.projects?.favorite?.some((i) => i === project.id) ? (
        <StarOutlined style={{ fontSize: 16 }} />
      ) : (
        <StarFilled style={{ fontSize: 16, color: colors.accent }} />
      )}
    </div>
  )
}

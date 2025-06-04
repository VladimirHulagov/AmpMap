import { Tooltip } from "antd"
import { useMeContext } from "processes"
import { useTranslation } from "react-i18next"

import BookmarkIcon from "shared/assets/yi-icons/bookmark.svg?react"
import BookmarkFillIcon from "shared/assets/yi-icons/bookmark_fill.svg?react"
import { antdNotification } from "shared/libs/antd-modals"
import { Button } from "shared/ui"

export const FolowProject = ({ project }: { project: Project }) => {
  const { t } = useTranslation()
  const { userConfig, updateConfig } = useMeContext()

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!project.is_visible) {
      return
    }
    const isNew = !userConfig?.projects?.favorite.some((i) => i === project.id)

    const newProjectIds = isNew
      ? userConfig?.projects?.favorite.concat([project.id])
      : userConfig?.projects?.favorite.filter((i) => Number(i) !== Number(project.id))

    const newConfig = {
      ...userConfig,
      projects: {
        ...userConfig?.projects,
        favorite: newProjectIds,
      },
    }

    try {
      await updateConfig(newConfig)
      antdNotification.success("follow-project", {
        description: `${project.name} ${isNew ? t("has been added to favorites") : t("has been removed to favorites")}`,
      })
    } catch (error) {
      antdNotification.error("follow-project", {
        description: t("Error when try to change follow project"),
      })
      console.error(error)
    }
  }

  const isFavoriteActive = !!userConfig?.projects?.favorite?.some((i) => i === project.id)

  return (
    <Tooltip title={t("Add to favorites")}>
      <Button
        id={`${project.name}-project-favorite-btn`}
        style={{ color: "var(--y-grey-30)" }}
        icon={!isFavoriteActive ? <BookmarkIcon /> : <BookmarkFillIcon />}
        type="button"
        color="ghost"
        shape="square"
        onClick={handleFavoriteClick}
        data-test-active={isFavoriteActive}
      />
    </Tooltip>
  )
}

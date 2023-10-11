import { StarFilled, StarOutlined } from "@ant-design/icons"

import { useUserConfig } from "entities/user/model"

import { colors } from "shared/config"

interface FavoriteBtnProps {
  projectId: number
  onClick: () => void
  projectName: string
}

export const FavoriteBtn = ({ onClick, projectId, projectName }: FavoriteBtnProps) => {
  const { userConfig } = useUserConfig()

  return (
    <div
      id={`${projectName}-project-favorite-btn`}
      style={{
        cursor: "pointer",
        width: 50,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClick}
    >
      {!userConfig?.projects?.favorite?.some((i) => i === projectId) ? (
        <StarOutlined style={{ fontSize: 16 }} />
      ) : (
        <StarFilled style={{ fontSize: 16, color: colors.accent }} />
      )}
    </div>
  )
}

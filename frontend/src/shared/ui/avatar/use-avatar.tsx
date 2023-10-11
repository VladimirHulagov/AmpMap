import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { useLogoutMutation } from "entities/auth/api"
import { selectUser } from "entities/auth/model"

export const useAvatarLogic = () => {
  const navigate = useNavigate()
  const [logoutRequest] = useLogoutMutation()

  const user = useSelector(selectUser)

  const handleLogout = () => {
    logoutRequest()
      .unwrap()
      .then(() => {
        navigate("/login")
      })
  }

  const handleProfileClick = () => {
    navigate("/profile")
  }

  return {
    user,
    handleLogout,
    handleProfileClick,
  }
}

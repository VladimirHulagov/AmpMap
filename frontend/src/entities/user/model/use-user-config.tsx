import { useAppDispatch, useAppSelector } from "app/hooks"

import { userConfig as baseUserConfig } from "shared/config/base-user-config"

import { selectUserConfig, setUserConfig } from "."
import { useLazyGetConfigQuery, useUpdateConfigMutation } from "../api"

interface UseUserConfigReturn {
  userConfig: IUserConfig
  updateConfig: (data: object) => Promise<void>
}

export const useUserConfig = (): UseUserConfigReturn => {
  const dispatch = useAppDispatch()
  const userConfigState = useAppSelector(selectUserConfig)
  const [updateConfigMutation] = useUpdateConfigMutation()
  const [getConfig] = useLazyGetConfigQuery()

  const updateConfig = async (data: object) => {
    const newConfig = {
      ...userConfigState,
      ...data,
    }
    dispatch(setUserConfig(newConfig))
    await updateConfigMutation(newConfig)
    await getConfig()
  }

  return {
    userConfig: {
      ...baseUserConfig,
      ...userConfigState,
    },
    updateConfig,
  }
}

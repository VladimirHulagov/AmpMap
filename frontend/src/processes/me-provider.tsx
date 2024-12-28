import { PropsWithChildren, createContext, useMemo } from "react"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useGetConfigQuery, useGetMeQuery, useUpdateConfigMutation } from "entities/user/api"
import { selectUserConfig, setUserConfig } from "entities/user/model"

interface MeContextType {
  me: User
  userConfig: UserConfig
  updateConfig: (data: object) => Promise<void>
}

export const MeContext = createContext<MeContextType | null>(null)

export const MeProvider = ({ children }: PropsWithChildren) => {
  const { data: me } = useGetMeQuery()
  const { data: config } = useGetConfigQuery({}, { skip: !me })
  const [updateConfigMutation] = useUpdateConfigMutation()

  const dispatch = useAppDispatch()
  const userConfigState = useAppSelector(selectUserConfig)

  const updateConfig = async (data: object) => {
    const newConfig = {
      ...userConfigState,
      ...data,
    }

    dispatch(setUserConfig(newConfig))
    await updateConfigMutation(newConfig)
  }

  const userConfig = useMemo(() => {
    if (!config) {
      return null
    }

    return {
      ...config,
      ...userConfigState,
    }
  }, [config, userConfigState])

  const value: MeContextType | null = useMemo(() => {
    if (!me || !userConfig) {
      return null
    }

    return {
      me,
      userConfig,
      updateConfig,
    }
  }, [me, userConfig, updateConfig])

  if (!value) {
    return null
  }

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>
}

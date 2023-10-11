import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useLocation, useNavigate } from "react-router-dom"

import { useLoginMutation } from "entities/auth/api"

import { useLazyGetConfigQuery, useLazyGetMeQuery } from "entities/user/api"

import { clearPrevPageUrl, getPrevPageUrl } from "shared/libs/local-storage"

export type Inputs = {
  username: string
  password: string
}

export const useAuthLogic = () => {
  const [login] = useLoginMutation()
  const [getMe] = useLazyGetMeQuery()
  const [getUserConfig] = useLazyGetConfigQuery()
  const [errMsg, setErrMsg] = useState("")
  const navigate = useNavigate()
  const { handleSubmit, reset, control } = useForm<Inputs>()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setErrMsg("")
    setIsLoading(true)

    try {
      await login(data).unwrap()
      await getMe().unwrap()
      await getUserConfig().unwrap()
      await reset()

      const prevPageUrl = getPrevPageUrl()
      if (prevPageUrl) {
        clearPrevPageUrl()
        navigate(prevPageUrl, { replace: true })
        return
      }

      if (location.state?.from) {
        navigate(`${location.state.from.pathname}${location.state.from.search}`)
        return
      }

      navigate("/")
    } catch (err: unknown) {
      const error = err as FetchBaseQueryError

      if (!error?.status) {
        setErrMsg("No Server Response")
      } else if (error.status === 400) {
        setErrMsg("Missing Username or Password")
      } else if (error.status === 401) {
        setErrMsg("Unauthorized")
      } else {
        setErrMsg("Login Failed")
      }
    }
    setIsLoading(false)
  }

  return {
    onSubmit: handleSubmit(onSubmit),
    errMsg,
    control,
    isLoading,
  }
}

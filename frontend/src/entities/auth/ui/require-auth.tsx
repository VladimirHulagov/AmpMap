import { Navigate, Outlet, useLocation } from "react-router-dom"

import { getCsrfCookie } from "../api"

export const RequireAuth = () => {
  const token = getCsrfCookie()
  const location = useLocation()

  return token ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />
}


import { Navigate } from "react-router-dom"
import { getToken, getUser } from "@/utils/auth"
export default function AdminGuard({ children }) {
  const token = getToken()
  const user = getUser()

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Logged in but not admin
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
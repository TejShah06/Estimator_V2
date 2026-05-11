import { Navigate } from "react-router-dom";
import { getToken } from "@/utils/auth";
export default function ProtectedRoute({ children }) {

  const token = getToken();

  if (!token) {
    alert("Please login first");
    return <Navigate to="/login" />;
  }

  return children;
}
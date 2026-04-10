import axios from "axios"

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/* ---------------- AUTH ---------------- */

export const loginUser = (data) => API.post("/auth/login", data)

export const registerUser = (data) => API.post("/auth/register", data)

export const requestPasswordReset = (data) =>
  API.post("/auth/request-password-reset", data)

export const resetPassword = (token, data) =>
  API.post(`/auth/reset-password/${token}`, data)


/* ---------------- DASHBOARD ---------------- */

export const getDashboardStats = () =>
  API.get("/dashboard/stats")

export const getRecentProjects = () =>
  API.get("/projects/recent")



/* ---------------- FLOORPLAN ---------------- */

export const analyzeFloorplan = (formData) =>
  API.post("/floorplan/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })


/* ---------------- CALCULATOR ---------------- */

export const calculateEstimate = (data) =>
  API.post("/calculator", data)

export default API
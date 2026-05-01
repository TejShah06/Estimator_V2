
import API from "./api"

// Dashboard
export const getAdminStats = () => API.get("/admin/dashboard/stats")

// Analytics
export const getMonthlyAnalytics = () => API.get("/admin/analytics/monthly")

// Users
export const getAllUsers = (params) => API.get("/admin/users", { params })
export const getUserDetail = (id) => API.get(`/admin/users/${id}`)
export const toggleUserStatus = (id) => API.patch(`/admin/users/${id}/toggle-status`)
export const deleteUser = (id) => API.delete(`/admin/users/${id}`)

// Projects
export const getAllProjects = (params) => API.get("/admin/projects", { params })
export const deleteProject = (id) => API.delete(`/admin/projects/${id}`)

// Settings
export const getSettings = () => API.get("/admin/settings")
export const updateSettings = (data) => API.put("/admin/settings", data)

// Logs
export const getActivityLogs = (params) => API.get("/admin/logs", { params })
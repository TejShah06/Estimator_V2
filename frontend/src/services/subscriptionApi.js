import axios from "axios"
import { getToken } from "../utils/auth"
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
})

API.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Plans ────────────────────────────────────────────────
export const getPlans = () => API.get("/subscription/plans")

export const getMyPlan = () => API.get("/subscription/my-plan")

// ── Payment ──────────────────────────────────────────────
export const createOrder = (data) =>
  API.post("/subscription/create-order", data)

export const verifyPayment = (data) =>
  API.post("/subscription/verify-payment", data)

// ── Trial ────────────────────────────────────────────────
export const startTrial = (planName) =>
  API.post(`/subscription/start-trial?plan_name=${planName}`)

// ── Manage ───────────────────────────────────────────────
export const cancelSubscription = () => API.post("/subscription/cancel")

export const getPaymentHistory = () => API.get("/subscription/payment-history")

// ── Permission checks ─────────────────────────────────────
export const checkDownloadPermission = (reportType) =>
  API.get(`/subscription/check-download/${reportType}`)

// ── PDF Downloads ─────────────────────────────────────────
export const downloadAiReportPdf = (projectId) =>
  API.get(`/floorplan/report/${projectId}/download-pdf`, {
    responseType: "blob",
  })

export const downloadManualReportPdf = (estimationId) =>
  API.get(`/estimations/manual/${estimationId}/download-pdf`, {
    responseType: "blob",
  })
export const previewUpgrade = (data) =>
  API.post("/subscription/preview-upgrade", data)

export default API
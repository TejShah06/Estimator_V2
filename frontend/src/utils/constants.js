// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// Default construction rates (INR)
export const DEFAULT_RATES = {
  flooring_cost_per_sqft: 85,
  wall_paint_cost_per_sqft: 18,
  ceiling_paint_cost_per_sqft: 14,
  door_unit_cost: 8500,
  window_unit_cost: 6000,
  electrical_per_room: 5500,
  plumbing_per_wet_room: 25000,
  wall_height_ft: 10,
}

// Cost chart colors
export const COST_COLORS = {
  flooring: "#14B8A6",
  painting: "#EC4899",
  electrical: "#8B5CF6",
  plumbing: "#F97316",
  doors: "#3B82F6",
  windows: "#F59E0B",
  ceiling: "#06B6D4",
}

// Pipeline stages
export const PIPELINE_STAGES = [
  { id: 1, name: "Preprocessing", key: "preprocessing" },
  { id: 2, name: "YOLO Detection", key: "yolo" },
  { id: 3, name: "Wall Segmentation", key: "segmentation" },
  { id: 4, name: "Skeletonization", key: "skeleton" },
  { id: 5, name: "OCR Engine", key: "ocr" },
  { id: 6, name: "Scale Calculation", key: "scale" },
  { id: 7, name: "Geometry Engine", key: "geometry" },
  { id: 8, name: "Cost Estimation", key: "estimation" },
  { id: 9, name: "Preview Generation", key: "preview" },
]

// File upload config
export const UPLOAD_CONFIG = {
  maxSize: 20 * 1024 * 1024, // 20MB
  acceptedTypes: ["image/jpeg", "image/png", "image/bmp", "image/tiff", "image/webp"],
  acceptedExtensions: [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"],
}
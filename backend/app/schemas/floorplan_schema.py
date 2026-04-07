from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FloorPlanProjectCreate(BaseModel):
    project_name: Optional[str] = "Untitled Project"
    source_type: Optional[str] = "ai"
    rooms_count: Optional[int] = 0
    doors_count: Optional[int] = 0
    windows_count: Optional[int] = 0
    total_area_sqft: Optional[float] = 0.0
    total_area_m2: Optional[float] = 0.0
    scale_method: Optional[str] = "unknown"
    scale_px_per_foot: Optional[float] = 0.0
    rooms_json: Optional[str] = None
    estimated_cost: Optional[float] = 0.0
    flooring_cost: Optional[float] = 0.0
    painting_cost: Optional[float] = 0.0
    ceiling_cost: Optional[float] = 0.0
    electrical_cost: Optional[float] = 0.0
    plumbing_cost: Optional[float] = 0.0
    doors_cost: Optional[float] = 0.0
    windows_cost: Optional[float] = 0.0
    preview_path: Optional[str] = None
    analysis_time_seconds: Optional[float] = 0.0
    status: Optional[str] = "completed"


class FloorPlanProjectResponse(BaseModel):
    id: int
    user_id: int
    project_name: str
    source_type: str
    rooms_count: int
    doors_count: int
    windows_count: int
    total_area_sqft: float
    total_area_m2: float
    estimated_cost: float
    flooring_cost: float
    painting_cost: float
    ceiling_cost: float
    electrical_cost: float
    plumbing_cost: float
    doors_cost: float
    windows_cost: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_projects: int
    ai_projects: int
    manual_projects: int
    total_cost: float
    total_area_sqft: float
    total_rooms: int


class RecentProject(BaseModel):
    id: int
    project_name: str
    source_type: str
    estimated_cost: float
    rooms_count: int
    doors_count: int
    windows_count: int
    total_area_sqft: float
    status: str
    created_at: Optional[str] = None
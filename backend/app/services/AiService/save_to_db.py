import json
import logging

logger = logging.getLogger(__name__)


def save_floorplan_to_db(db, user_id, result, project_name="Untitled"):
    """
    Save floorplan analysis result to database.
    Call this AFTER analyze_floorplan() returns.

    Args:
        db: SQLAlchemy session
        user_id: Current user ID
        result: The dict returned by analyze_floorplan()
        project_name: Name for the project
    """
    from app.models.floorplan_project import FloorPlanProject

    estimation = result.get("estimation", {})
    summary = estimation.get("summary", {})
    rooms = result.get("rooms", [])
    scale = result.get("scale", {})

    project = FloorPlanProject(
        user_id=user_id,
        project_name=project_name,
        source_type="ai",
        # Counts
        rooms_count=result.get("rooms_count", 0),
        doors_count=result.get("doors_count", 0),
        windows_count=result.get("windows_count", 0),
        # Area
        total_area_sqft=summary.get("total_area_sqft", 0.0),
        total_area_m2=summary.get("total_area_m2", 0.0),
        # Scale
        scale_method=scale.get("method", "unknown"),
        scale_px_per_foot=scale.get("px_per_foot", 0.0),
        # Room details as JSON
        rooms_json=json.dumps(rooms, default=str) if rooms else None,
        # Costs
        estimated_cost=summary.get("grand_total_inr", 0.0),
        flooring_cost=summary.get("total_flooring_cost", 0.0),
        painting_cost=summary.get("total_wall_paint_cost", 0.0),
        ceiling_cost=summary.get("total_ceiling_paint_cost", 0.0),
        electrical_cost=summary.get("total_electrical_cost", 0.0),
        plumbing_cost=summary.get("total_plumbing_cost", 0.0),
        doors_cost=summary.get("doors_cost", 0.0),
        windows_cost=summary.get("windows_cost", 0.0),
        # Preview
        preview_path=result.get("preview_url", "/previews/preview.jpg"),
        # Timing
        analysis_time_seconds=result.get("timings", {}).get("total", 0.0),
        # Status
        status="completed",
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    logger.info(f"Saved FloorPlanProject #{project.id}: "
                f"'{project.project_name}' "
                f"cost=₹{project.estimated_cost:,.2f}, "
                f"area={project.total_area_sqft:.0f}sqft, "
                f"rooms={project.rooms_count}")

    return project

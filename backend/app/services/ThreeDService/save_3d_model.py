import os

from app.models.floorplan_3dmodel import (
    FloorPlan3DModel
)


def save_3d_model(
    db,
    project_id,
    glb_path,
    generation_time
):

    size=os.path.getsize(
        glb_path
    )

    model=FloorPlan3DModel(
        project_id=project_id,
        glb_file_path=glb_path, 
        generation_method="rule_based",
        generator_software="Blender",
        generation_time_seconds=generation_time,
        file_size_bytes=size,
        processing_status="completed"
    )

    db.add(model)
    db.commit()
    db.refresh(model)

    return model
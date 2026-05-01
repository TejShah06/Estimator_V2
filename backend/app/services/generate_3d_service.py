import time
import logging

from sqlalchemy.orm import Session

from app.services.ThreeDService.geomatry_builder import build_geometry
from app.services.ThreeDService.adjestancy_graph import build_adjacency_graph   
from app.services.ThreeDService.mesh_generator import generate_mesh_data
from app.services.ThreeDService.blender_exporter import run_blender_export
from app.services.ThreeDService.save_3d_model import save_3d_model



logger=logging.getLogger(__name__)


def generate_3d_service(
    floorplan_result:dict,
    project_id:int,
    db:Session
):
    t0=time.time()

    logger.info(
        "3D GENERATION START"
    )

    # Stage 1
    geometry=build_geometry(
        floorplan_result
    )

    # Stage 2
    graph_data=build_adjacency_graph(
        geometry
    )

    # Stage 3
    mesh_data=generate_mesh_data(
        project_id,
        geometry
    )

    # Stage 4
    exported=run_blender_export(
        mesh_data["geometry_file"],
        mesh_data["model_dir"]
    )

    # Stage 5
    model=save_3d_model(
        db=db,
        project_id=project_id,
        glb_path=exported["glb_file"],
        generation_time=time.time()-t0
    )

    return {
        "model_id":model.id,
        "project_id":project_id,
        "status":"completed",
        "glb_file":model.glb_file_path,
        "adjacency_edges":graph_data["edges"],
        "generation_time":
            round(
                time.time()-t0,
                3
            )
    }
import time
import logging
import json
import os
import tempfile
from pathlib import Path

from app.services.ThreeDService.geomatry_builder import build_geometry
from app.services.ThreeDService.mesh_Builder import build_floorplan_mesh
from app.services.ThreeDService.adjestancy_graph import build_adjacency_graph
from app.services.ThreeDService.blender_exporter import run_blender_export_to_memory

logger = logging.getLogger(__name__)


def generate_3d_service_memory(floorplan_result: dict, project_id: int) -> dict:
    """
    Generate 3D model and return as binary data (NO DATABASE, NO PERMANENT STORAGE)
    
    Args:
        floorplan_result: Floorplan analysis data
        project_id: Project ID for logging only
        
    Returns:
        dict with glb_bytes, metadata
    """
    t0 = time.time()
    
    logger.info("=" * 80)
    logger.info(f"3D GENERATION (MEMORY MODE) - Project {project_id}")
    logger.info("=" * 80)

    temp_geometry_file = None
    
    try:
        # ===== STAGE 1: Build Geometry =====
        logger.info("STAGE 1: Building geometry...")
        geometry = build_geometry(floorplan_result)
        logger.info("✓ Geometry built")
        
        # ===== STAGE 2: Build Mesh =====
        logger.info("STAGE 2: Building mesh with openings...")
        mesh_data = build_floorplan_mesh(geometry)
        logger.info("✓ Mesh built")
        
        # ===== STAGE 3: Build Adjacency Graph =====
        logger.info("STAGE 3: Building adjacency graph...")
        graph_data = build_adjacency_graph(geometry)
        logger.info("✓ Graph built")
        
        # ===== STAGE 4: Save Geometry to Temp File =====
        logger.info("STAGE 4: Creating temporary geometry file...")
        
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.json',
            delete=False,
            encoding='utf-8'
        ) as tmp_geo:
            temp_geometry_file = tmp_geo.name
            json.dump(mesh_data, tmp_geo, indent=2)
        
        logger.info(f"✓ Temp geometry: {temp_geometry_file}")
        
        # ===== STAGE 5: Blender Export to Memory =====
        logger.info("STAGE 5: Running Blender export to memory...")
        glb_bytes = run_blender_export_to_memory(temp_geometry_file)
        logger.info(f"✓ GLB in memory: {len(glb_bytes)} bytes")
        
        # ===== Calculate Stats =====
        generation_time = time.time() - t0
        
        wall_count = len(mesh_data.get("wall_segments", []))
        door_count = sum(
            1 for o in mesh_data.get("openings", []) 
            if o.get("opening_type") == "door"
        )
        window_count = sum(
            1 for o in mesh_data.get("openings", []) 
            if o.get("opening_type") == "window"
        )
        
        # ===== Final Summary =====
        logger.info("=" * 80)
        logger.info(f"✓ 3D GENERATION COMPLETE in {generation_time:.2f}s")
        logger.info("=" * 80)
        logger.info(f"Project ID: {project_id}")
        logger.info(f"GLB Size: {len(glb_bytes)} bytes ({len(glb_bytes)/1024:.2f} KB)")
        logger.info(f"Vertices: {len(mesh_data.get('vertices', []))}")
        logger.info(f"Walls: {wall_count}")
        logger.info(f"Doors: {door_count}")
        logger.info(f"Windows: {window_count}")
        logger.info("=" * 80)
        
        return {
            "glb_bytes": glb_bytes,
            "project_id": project_id,
            "generation_time": round(generation_time, 3),
            "file_size": len(glb_bytes),
            "wall_count": wall_count,
            "door_count": door_count,
            "window_count": window_count,
            "vertices_count": len(mesh_data.get("vertices", [])),
            "faces_count": len(mesh_data.get("faces", []))
        }

    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"❌ 3D GENERATION FAILED: {str(e)}")
        logger.error("=" * 80, exc_info=True)
        raise
        
    finally:
        # Cleanup is handled by blender_exporter_memory.py
        pass
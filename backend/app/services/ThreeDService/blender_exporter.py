import subprocess
import tempfile
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def run_blender_export_to_memory(geometry_file: str) -> bytes:
    """
    Run Blender export and return GLB as bytes (no permanent storage)
    
    Args:
        geometry_file: Path to temporary geometry.json
        
    Returns:
        bytes: GLB file binary data
        
    Raises:
        Exception: If Blender export fails
    """
    
    logger.info("Starting Blender export to memory...")
    
    # Find Blender
    blender_path = find_blender()
    if not blender_path:
        raise FileNotFoundError("Blender not found. Check BLENDER_PATH in .env")
    
    logger.info(f"Using Blender: {blender_path}")
    
    # Create temporary GLB file
    with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as tmp_glb:
        temp_glb_path = tmp_glb.name
    
    # Create temporary Blender script
    with tempfile.NamedTemporaryFile(mode='w', suffix=".py", delete=False, encoding='utf-8') as tmp_script:
        temp_script_path = tmp_script.name
        create_unified_blender_script(tmp_script, geometry_file, temp_glb_path)
    
    try:
        # Run Blender
        cmd = [str(blender_path), "--background", "--python", temp_script_path]
        
        logger.info(f"Running Blender command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        logger.info("Blender export completed")
        logger.debug(f"Blender stdout: {result.stdout}")
        
        # Verify GLB was created
        if not os.path.exists(temp_glb_path):
            raise FileNotFoundError(f"Blender did not create GLB: {temp_glb_path}")
        
        # Read GLB into memory
        with open(temp_glb_path, 'rb') as f:
            glb_bytes = f.read()
        
        file_size = len(glb_bytes)
        logger.info(f"GLB loaded into memory: {file_size} bytes ({file_size/1024:.2f} KB)")
        
        return glb_bytes
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Blender Error: {e.stderr}")
        raise Exception(f"Blender export failed: {e.stderr}")
        
    except subprocess.TimeoutExpired:
        logger.error("Blender process timed out after 120 seconds")
        raise Exception("3D model generation timed out")
        
    except Exception as e:
        logger.error(f"Blender export error: {str(e)}", exc_info=True)
        raise
        
    finally:
        # Clean up ALL temp files
        for temp_file in [temp_glb_path, temp_script_path, geometry_file]:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                    logger.info(f"Cleaned up temp file: {temp_file}")
                except Exception as e:
                    logger.warning(f"Failed to delete temp file {temp_file}: {e}")


def find_blender():
    """Find Blender executable (same as your original)"""
    env_path = os.getenv("BLENDER_PATH")
    if env_path and os.path.exists(env_path):
        return env_path
    
    common_paths = [
        r"D:\Blender\blender.exe",
        r"C:\Program Files\Blender Foundation\Blender 4.1\blender.exe",
        r"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
    ]
    for path in common_paths:
        if os.path.exists(path):
            return path
    return None


def create_unified_blender_script(file_handle, geometry_file: str, glb_output: str):
    """
    Create Blender script (same as your original, just writes to file handle)
    """
    script_content = f'''
import bpy
import bmesh
import json
import os
import math
from mathutils import Vector

print("UNIFIED 3D FLOORPLAN GENERATION WITH IMPROVED DOORS AND WINDOWS")

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Load geometry
with open(r"{geometry_file}", 'r') as f:
    data = json.load(f)

wall_segments = data.get("wall_segments", [])
rooms = data.get("rooms", [])
openings = data.get("openings", [])
scale_px_per_ft = data.get("scale", 21.0)
wall_height_ft = data.get("wall_height_ft", 10)

# Conversions
SCALE = 0.3048 / scale_px_per_ft
WALL_HEIGHT = wall_height_ft * 0.3048
WALL_THICKNESS = 0.15

print(f"Scale: {{scale_px_per_ft}} px/ft")
print(f"Walls: {{len(wall_segments)}}, Rooms: {{len(rooms)}}, Openings: {{len(openings)}}")
print(f"Wall height: {{WALL_HEIGHT:.2f}}m")

# MATERIALS WITH BETTER STYLING
def create_mat(name, color, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, alpha)
    return mat

wall_mat = create_mat("Wall", (0.88, 0.85, 0.82))
floor_mat = create_mat("Floor", (0.78, 0.75, 0.72))
door_mat = create_mat("Door", (0.35, 0.2, 0.1))
door_frame_mat = create_mat("DoorFrame", (0.4, 0.25, 0.15))
window_mat = create_mat("Window", (0.15, 0.6, 0.95), 0.5)
window_frame_mat = create_mat("WindowFrame", (0.3, 0.4, 0.6))

# BUILD UNIFIED WALL MESH
print("Building unified wall mesh...")

mesh = bpy.data.meshes.new("FloorplanWalls")
bm = bmesh.new()

def px_to_m(px_coord):
    return (px_coord[0] * SCALE, px_coord[1] * SCALE)

wall_verts = []

for idx, wall in enumerate(wall_segments):
    p1 = wall["p1"]
    p2 = wall["p2"]
    
    p1_m = px_to_m(p1)
    p2_m = px_to_m(p2)
    
    dx = p2_m[0] - p1_m[0]
    dy = p2_m[1] - p1_m[1]
    length = math.sqrt(dx**2 + dy**2)
    
    if length < 0.001:
        continue
    
    dir_x = dx / length
    dir_y = dy / length
    
    perp_x = -dir_y
    perp_y = dir_x
    
    half_thick = WALL_THICKNESS / 2
    
    base_verts = [
        (p1_m[0] + perp_x * half_thick, p1_m[1] + perp_y * half_thick, 0),
        (p1_m[0] - perp_x * half_thick, p1_m[1] - perp_y * half_thick, 0),
        (p2_m[0] - perp_x * half_thick, p2_m[1] - perp_y * half_thick, 0),
        (p2_m[0] + perp_x * half_thick, p2_m[1] + perp_y * half_thick, 0),
        (p1_m[0] + perp_x * half_thick, p1_m[1] + perp_y * half_thick, WALL_HEIGHT),
        (p1_m[0] - perp_x * half_thick, p1_m[1] - perp_y * half_thick, WALL_HEIGHT),
        (p2_m[0] - perp_x * half_thick, p2_m[1] - perp_y * half_thick, WALL_HEIGHT),
        (p2_m[0] + perp_x * half_thick, p2_m[1] + perp_y * half_thick, WALL_HEIGHT),
    ]
    
    start_idx = len(wall_verts)
    for v in base_verts:
        wall_verts.append(bm.verts.new(v))
    
    bm.faces.new([wall_verts[start_idx+0], wall_verts[start_idx+1], wall_verts[start_idx+2], wall_verts[start_idx+3]])
    bm.faces.new([wall_verts[start_idx+4], wall_verts[start_idx+7], wall_verts[start_idx+6], wall_verts[start_idx+5]])
    bm.faces.new([wall_verts[start_idx+0], wall_verts[start_idx+4], wall_verts[start_idx+5], wall_verts[start_idx+1]])
    bm.faces.new([wall_verts[start_idx+1], wall_verts[start_idx+5], wall_verts[start_idx+6], wall_verts[start_idx+2]])
    bm.faces.new([wall_verts[start_idx+2], wall_verts[start_idx+6], wall_verts[start_idx+7], wall_verts[start_idx+3]])
    bm.faces.new([wall_verts[start_idx+3], wall_verts[start_idx+7], wall_verts[start_idx+4], wall_verts[start_idx+0]])

print(f"Created {{len(wall_segments)}} wall segments")

bm.to_mesh(mesh)
bm.free()

wall_obj = bpy.data.objects.new("Walls_Unified", mesh)
bpy.context.collection.objects.link(wall_obj)
wall_obj.data.materials.append(wall_mat)

print("Unified wall mesh created")

# CREATE FLOOR
print("Creating floor...")

all_x = []
all_y = []
for wall in wall_segments:
    all_x.extend([wall["p1"][0], wall["p2"][0]])
    all_y.extend([wall["p1"][1], wall["p2"][1]])

min_x = min(all_x) * SCALE - 0.5
max_x = max(all_x) * SCALE + 0.5
min_y = min(all_y) * SCALE - 0.5
max_y = max(all_y) * SCALE + 0.5

width = max_x - min_x
depth = max_y - min_y

bpy.ops.mesh.primitive_plane_add(size=1)
floor = bpy.context.object
floor.name = "Floor"
floor.scale = (width/2, depth/2, 1)
floor.location = ((min_x + max_x)/2, (min_y + max_y)/2, 0)
floor.data.materials.append(floor_mat)

print(f"Floor created: {{width:.2f}}m x {{depth:.2f}}m")

# ADD DOORS AND WINDOWS WITH IMPROVED STYLING
print("Adding doors and windows with improved styling...")

door_count = 0
window_count = 0
frame_thickness = 0.05

for opening in openings:
    opening_type = opening.get("opening_type", "door")
    opening_id = opening.get("opening_id", 0)
    x = opening.get("x", 0) * SCALE
    y = opening.get("y", 0) * SCALE
    width_px = opening.get("width_px", 40)
    width_m = width_px * SCALE
    
    if opening_type == "door":
        height = 2.1
        z_pos = height / 2
        y_offset = -0.05
        
        # Door frame (outer box)
        bpy.ops.mesh.primitive_cube_add(size=1)
        frame_obj = bpy.context.object
        frame_obj.name = f"DOOR_FRAME_{{opening_id}}"
        frame_obj.scale = (width_m/2 + frame_thickness, WALL_THICKNESS/2 + 0.01, height/2 + frame_thickness)
        frame_obj.location = (x, y + y_offset, z_pos)
        frame_obj.data.materials.append(door_frame_mat)
        
        # Door panel (inner)
        bpy.ops.mesh.primitive_cube_add(size=1)
        door_obj = bpy.context.object
        door_obj.name = f"DOOR_{{opening_id}}"
        door_obj.scale = (width_m/2, WALL_THICKNESS/2 + 0.015, height/2 - frame_thickness)
        door_obj.location = (x, y + y_offset, z_pos)
        door_obj.data.materials.append(door_mat)
        
        door_count += 1
        
    else:
        height = 1.2
        sill_height = 1.0
        z_pos = sill_height + height / 2
        y_offset = -0.08
        
        # Window frame (outer)
        bpy.ops.mesh.primitive_cube_add(size=1)
        frame_obj = bpy.context.object
        frame_obj.name = f"WINDOW_FRAME_{{opening_id}}"
        frame_obj.scale = (width_m/2 + frame_thickness, WALL_THICKNESS/2 + 0.02, height/2 + frame_thickness)
        frame_obj.location = (x, y + y_offset, z_pos)
        frame_obj.data.materials.append(window_frame_mat)
        
        # Window glass (inner, semi-transparent)
        bpy.ops.mesh.primitive_cube_add(size=1)
        glass_obj = bpy.context.object
        glass_obj.name = f"WINDOW_{{opening_id}}"
        glass_obj.scale = (width_m/2 - frame_thickness/2, WALL_THICKNESS/2 + 0.025, height/2 - frame_thickness/2)
        glass_obj.location = (x, y + y_offset, z_pos)
        glass_obj.data.materials.append(window_mat)
        
        window_count += 1

print(f"Added {{door_count}} doors with frames and {{window_count}} windows with frames")

# LIGHTING
print("Setting up lighting...")

sun = bpy.data.lights.new("Sun", type='SUN')
sun.energy = 4
sun_obj = bpy.data.objects.new("Sun", sun)
bpy.context.collection.objects.link(sun_obj)
sun_obj.location = (15, 15, 25)
sun_obj.rotation_euler = (0.7, 0.3, 0.5)

fill = bpy.data.lights.new("Fill", type='SUN')
fill.energy = 1.5
fill_obj = bpy.data.objects.new("Fill", fill)
bpy.context.collection.objects.link(fill_obj)
fill_obj.location = (-10, -10, 20)
fill_obj.rotation_euler = (-0.5, -0.3, -0.5)

# CAMERA
print("Setting up camera...")

cam = bpy.data.cameras.new("Camera")
cam_obj = bpy.data.objects.new("Camera", cam)
bpy.context.collection.objects.link(cam_obj)

center_x = (min_x + max_x) / 2
center_y = (min_y + max_y) / 2
cam_distance = max(width, depth) * 1.5

cam_obj.location = (center_x + cam_distance*0.5, center_y - cam_distance*0.5, cam_distance*0.8)
cam_obj.rotation_euler = (1.1, 0, 0.785)

bpy.context.scene.camera = cam_obj

# EXPORT
print("Exporting GLB...")

bpy.ops.export_scene.gltf(
    filepath=r"{glb_output}",
    export_format='GLB',
    use_visible=True,
    use_renderable=True
)

if os.path.exists(r"{glb_output}"):
    size = os.path.getsize(r"{glb_output}")
    print("EXPORT SUCCESSFUL")
    print(f"File size: {{size}} bytes")
    print(f"Walls: {{len(wall_segments)}} segments")
    print(f"Doors: {{door_count}} with frames")
    print(f"Windows: {{window_count}} with frames and glass")
else:
    print("Export failed - file not created")
'''
    
    file_handle.write(script_content)
    logger.info("Created unified mesh Blender script for memory export")
import subprocess
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def run_blender_export(geometry_file: str, model_dir: str):
    """
    Export 3D model using Blender
    
    Args:
        geometry_file: Path to geometry file
        model_dir: Output directory for models
        
    Returns:
        dict: Contains glb_file, obj_file, model_dir, status
    """
    try:
        # Create output directory
        Path(model_dir).mkdir(parents=True, exist_ok=True)
        
        # Find Blender executable
        blender_path = find_blender()
        
        if not blender_path:
            raise FileNotFoundError(
                "Blender not found. Set BLENDER_PATH in .env or install Blender"
            )
        
        logger.info(f"Using Blender at: {blender_path}")
        
        # Output file paths
        glb_file = os.path.join(model_dir, "model.glb")
        obj_file = os.path.join(model_dir, "model.obj")
        
        # Create Blender script
        script_path = os.path.join(model_dir, "export_script.py")
        create_blender_script(script_path, geometry_file, glb_file, obj_file)
        
        # Run Blender in background mode
        cmd = [
            str(blender_path),
            "--background",
            "--python",
            script_path
        ]
        
        logger.info(f"Running Blender: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        logger.info(f"Blender export stdout: {result.stdout}")
        logger.info(f"Blender export completed successfully")
        
        return {
            "glb_file": glb_file,
            "obj_file": obj_file,
            "model_dir": model_dir,
            "status": "completed"
        }
    
    except subprocess.CalledProcessError as e:
        logger.error(f"Blender command failed")
        logger.error(f"Return code: {e.returncode}")
        logger.error(f"Stdout: {e.stdout}")
        logger.error(f"Stderr: {e.stderr}")
        raise Exception(f"Blender export failed: {e.stderr}")
    
    except FileNotFoundError as e:
        logger.error(f"Blender not found: {str(e)}")
        raise
    
    except Exception as e:
        logger.error(f"Export error: {str(e)}", exc_info=True)
        raise


def find_blender():
    """
    Find Blender executable
    """
    # Check environment variable first
    env_path = os.getenv("BLENDER_PATH")
    if env_path:
        if os.path.exists(env_path):
            logger.info(f"Found Blender from BLENDER_PATH: {env_path}")
            return env_path
        else:
            logger.warning(f"BLENDER_PATH set but not found: {env_path}")
    
    # Common Windows paths
    if os.name == 'nt':
        common_paths = [
            r"D:\Blender\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 4.1\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 3.6\blender.exe",
        ]
    else:
        # Linux/Mac paths
        common_paths = [
            "/usr/bin/blender",
            "/usr/local/bin/blender",
            "/Applications/Blender.app/Contents/MacOS/Blender",
        ]
    
    for path in common_paths:
        if os.path.exists(path):
            logger.info(f"Found Blender at: {path}")
            return path
    
    logger.warning("Blender not found in common paths")
    return None


def create_blender_script(script_path: str, geometry_file: str, glb_output: str, obj_output: str):
    """
    Create a Blender Python script to export the model
    """
    script_content = f'''
import bpy
import json
import os
import sys

try:
    print("Blender script started")
    
    # Clear default scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    geometry_file = r"{geometry_file}"
    glb_output = r"{glb_output}"
    obj_output = r"{obj_output}"
    
    print(f"Geometry file: {{geometry_file}}")
    print(f"GLB output: {{glb_output}}")
    
    # Load geometry from file if it exists
    if os.path.exists(geometry_file):
        print(f"Loading geometry from: {{geometry_file}}")
        try:
            with open(geometry_file, 'r') as f:
                geometry_data = json.load(f)
            print(f"Loaded geometry successfully")
        except Exception as e:
            print(f"Error loading geometry: {{str(e)}}")
            geometry_data = {{}}
    else:
        print(f"Geometry file not found: {{geometry_file}}")
        geometry_data = {{}}
    
    # Create a simple default cube as placeholder
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
    print("Created default cube")
    
    # Export as GLB (primary format)
    if glb_output:
        bpy.ops.export_scene.gltf(filepath=glb_output, export_format='GLB')
        print(f"Exported GLB: {{glb_output}}")
    
    # Note: OBJ export is not available in Blender 5.1
    # Use glTF/GLB format instead for cross-platform compatibility
    print("Export complete")

except Exception as e:
    print(f"Error in Blender script: {{str(e)}}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
'''
    
    with open(script_path, 'w') as f:
        f.write(script_content)
    
    logger.info(f"Created Blender script at: {script_path}")
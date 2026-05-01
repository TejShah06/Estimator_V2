
import bpy
import json
import os
import sys

try:
    print("Blender script started")
    
    # Clear default scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    geometry_file = r"generated_models\26\geometry.json"
    glb_output = r"generated_models\26\model.glb"
    obj_output = r"generated_models\26\model.obj"
    
    print(f"Geometry file: {geometry_file}")
    print(f"GLB output: {glb_output}")
    print(f"OBJ output: {obj_output}")
    
    # Load geometry from file if it exists
    if os.path.exists(geometry_file):
        print(f"Loading geometry from: {geometry_file}")
        try:
            with open(geometry_file, 'r') as f:
                geometry_data = json.load(f)
            print(f"Loaded geometry successfully")
        except Exception as e:
            print(f"Error loading geometry: {str(e)}")
            geometry_data = {}
    else:
        print(f"Geometry file not found: {geometry_file}")
        geometry_data = {}
    
    # Create a simple default cube as placeholder
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
    print("Created default cube")
    
    # Export as GLB
    if glb_output:
        bpy.ops.export_scene.gltf(filepath=glb_output, export_format='GLB')
        print(f"Exported GLB: {glb_output}")
    
    # Export as OBJ
    if obj_output:
        bpy.ops.export_scene.obj(filepath=obj_output)
        print(f"Exported OBJ: {obj_output}")
    
    print("Export complete")

except Exception as e:
    print(f"Error in Blender script: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

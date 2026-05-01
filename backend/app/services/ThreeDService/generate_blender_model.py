import bpy
import sys
import json
from pathlib import Path


args=sys.argv
args=args[args.index("--")+1:]

geometry_file=args[0]
output_dir=args[1]


bpy.ops.wm.read_factory_settings(
    use_empty=True
)


with open(geometry_file) as f:
    data=json.load(f)


for room in data["rooms"]:

    width=room["width_ft"]
    depth=room["depth_ft"]

    x=room["polygon_points"][0][0]/20
    y=room["polygon_points"][0][1]/20

    bpy.ops.mesh.primitive_cube_add(
        location=(x,y,5)
    )

    obj=bpy.context.object

    obj.scale=(
        width/2,
        depth/2,
        5
    )


export_path=str(
    Path(output_dir)/"model.glb"
)

bpy.ops.export_scene.gltf(
    filepath=export_path,
    export_format="GLB"
)
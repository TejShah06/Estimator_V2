import json
from pathlib import Path


BASE_OUTPUT=Path("generated_models")
BASE_OUTPUT.mkdir(exist_ok=True)


def generate_mesh_data(
    project_id,
    geometry
):
    model_dir=BASE_OUTPUT/str(project_id)
    model_dir.mkdir(exist_ok=True)

    geometry_json=model_dir/"geometry.json"

    payload={
        "wall_height_ft":10,
        "rooms":geometry["rooms"]
    }

    with open(
        geometry_json,
        "w"
    ) as f:
        json.dump(
            payload,
            f,
            indent=2
        )

    return {
        "model_dir":str(model_dir),
        "geometry_file":str(geometry_json)
    }
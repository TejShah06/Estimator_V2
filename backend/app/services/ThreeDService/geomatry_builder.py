from dataclasses import dataclass, asdict


@dataclass
class RoomGeometry:
    room_id: int
    label: str
    polygon_points: list
    width_ft: float
    depth_ft: float
    centroid: tuple
    wall_thickness_ft: float


def px_to_ft(px, scale):
    return px / scale


def bbox_to_polygon(bbox):
    x,y,w,h = bbox

    return [
        [x,y],
        [x+w,y],
        [x+w,y+h],
        [x,y+h]
    ]


def build_geometry(floorplan_data):

    scale = floorplan_data["scale"]["px_per_foot"]

    rooms=[]

    for r in floorplan_data["rooms"]:

        bbox=r["bbox"]

        room=RoomGeometry(
            room_id=r["room_id"],
            label=r["label"],
            polygon_points=bbox_to_polygon(bbox),
            width_ft=px_to_ft(bbox[2],scale),
            depth_ft=px_to_ft(bbox[3],scale),
            centroid=tuple(r["centroid"]),
            wall_thickness_ft=r["wall_thickness_ft"]
        )

        rooms.append(asdict(room))

    return {
        "rooms": rooms,
        "scale": scale
    }
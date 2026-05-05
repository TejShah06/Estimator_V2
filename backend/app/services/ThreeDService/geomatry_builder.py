from dataclasses import dataclass, asdict
import logging
import json

logger = logging.getLogger(__name__)


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
    x, y, w, h = bbox
    return [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h]
    ]


def build_geometry(floorplan_data):
    """
    Build complete geometry including rooms, doors, and windows
    """
    
    logger.info("Building geometry with doors and windows...")
    
    scale = floorplan_data["scale"]["px_per_foot"]
    
    # Build rooms
    rooms = []
    rooms_dict = {}
    
    for r in floorplan_data.get("rooms", []):
        bbox = r["bbox"]
        
        room = RoomGeometry(
            room_id=r["room_id"],
            label=r["label"],
            polygon_points=bbox_to_polygon(bbox),
            width_ft=px_to_ft(bbox[2], scale),
            depth_ft=px_to_ft(bbox[3], scale),
            centroid=tuple(r["centroid"]),
            wall_thickness_ft=r["wall_thickness_ft"]
        )
        
        room_dict = asdict(room)
        rooms.append(room_dict)
        rooms_dict[r["room_id"]] = room_dict
    
    logger.info(f"Built {len(rooms)} rooms")
    
    # Extract openings (doors and windows)
    openings = extract_openings_from_floorplan(floorplan_data)
    logger.info(f"Extracted {len(openings)} openings")
    
    # Summary statistics
    doors = [o for o in openings if o["opening_type"] == "door"]
    windows = [o for o in openings if o["opening_type"] == "window"]
    
    logger.info(f"  - Doors: {len(doors)}")
    logger.info(f"  - Windows: {len(windows)}")
    
    return {
        "rooms": rooms,
        "openings": openings,
        "scale": scale,
        "wall_height_ft": floorplan_data.get("total_floors", 1) * 10,
        "statistics": {
            "total_rooms": len(rooms),
            "total_doors": len(doors),
            "total_windows": len(windows),
            "total_openings": len(openings)
        }
    }


def extract_openings_from_floorplan(floorplan_data):
    """
    Extract door and window information from floorplan detection data
    
    The floorplan_data should contain room information with door and window counts
    """
    openings = []
    scale = floorplan_data["scale"]["px_per_foot"]
    rooms = floorplan_data.get("rooms", [])
    
    opening_id = 1
    
    for room in rooms:
        room_id = room["room_id"]
        centroid = room["centroid"]
        bbox = room["bbox"]
        doors_count = room.get("doors", 0)
        windows_count = room.get("windows", 0)
        
        # Create door openings for this room
        for i in range(int(doors_count)):
            # Position doors along the walls (distribute them)
            # Slightly offset from room bounds
            x = centroid[0] + (i - doors_count/2) * 60
            y = bbox[1] + 20  # Near the top wall of room
            
            opening = {
                "opening_id": opening_id,
                "opening_type": "door",
                "room_id": room_id,
                "x": x,
                "y": y,
                "width_px": 40,  # Standard door width
                "height_px": 84,  # Standard door height (7 ft)
                "centroid": [x, y],
                "bbox": [x - 20, y, 40, 84]
            }
            openings.append(opening)
            opening_id += 1
            logger.info(f"Added door #{opening['opening_id']-1} in room {room_id}")
        
        # Create window openings for this room
        for i in range(int(windows_count)):
            # Position windows along walls (different from doors)
            x = centroid[0] + (i - windows_count/2) * 60
            y = bbox[1] + bbox[3] - 20  # Near the bottom wall
            
            opening = {
                "opening_id": opening_id,
                "opening_type": "window",
                "room_id": room_id,
                "x": x,
                "y": y,
                "width_px": 36,  # Standard window width
                "height_px": 48,  # Standard window height
                "centroid": [x, y],
                "bbox": [x - 18, y, 36, 48]
            }
            openings.append(opening)
            opening_id += 1
            logger.info(f"Added window #{opening['opening_id']-1} in room {room_id}")
    
    logger.info(f"Total openings extracted: {len(openings)}")
    return openings
import json
import logging
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)


def build_floorplan_mesh(geometry_data: Dict) -> Dict:
    """
    Build a proper 3D mesh for the floorplan using geometry data
    """
    
    rooms = geometry_data.get("rooms", [])
    openings = geometry_data.get("openings", [])
    scale = geometry_data.get("scale", 1)
    wall_height_ft = geometry_data.get("wall_height_ft", 10)
    
    logger.info(f"Building mesh: {len(rooms)} rooms, {len(openings)} openings")
    
    # Collect all wall segments
    wall_segments = collect_wall_segments(rooms, scale)
    logger.info(f"Collected {len(wall_segments)} wall segments")
    
    # Assign openings to walls
    walls_with_openings = assign_openings_to_walls(wall_segments, openings, scale, rooms)
    
    return {
        "rooms": rooms,
        "wall_segments": walls_with_openings,
        "openings": openings,
        "wall_height_ft": wall_height_ft,
        "scale": scale
    }


def collect_wall_segments(rooms: List[Dict], scale: float) -> List[Dict]:
    """
    Collect all wall segments from rooms (unique edges only)
    """
    wall_segments = {}
    
    for room in rooms:
        poly = room["polygon_points"]
        room_id = room["room_id"]
        thickness = room.get("wall_thickness_ft", 0.3) * 0.3048
        
        for i in range(len(poly)):
            p1 = poly[i]
            p2 = poly[(i + 1) % len(poly)]
            
            # Create unique key
            key = tuple(sorted([tuple(p1), tuple(p2)]))
            
            if key not in wall_segments:
                wall_segments[key] = {
                    "p1": p1,
                    "p2": p2,
                    "thickness": thickness,
                    "room_ids": [room_id],
                    "openings": []
                }
            else:
                if room_id not in wall_segments[key]["room_ids"]:
                    wall_segments[key]["room_ids"].append(room_id)
    
    return list(wall_segments.values())


def assign_openings_to_walls(walls: List[Dict], openings: List[Dict], scale: float, rooms: List[Dict]) -> List[Dict]:
    """
    Intelligently assign door and window openings to their respective walls
    """
    
    logger.info(f"Assigning {len(openings)} openings to walls...")
    
    for opening in openings:
        opening_type = opening.get("opening_type", "door")
        room_id = opening.get("room_id")
        x = opening["x"]
        y = opening["y"]
        
        # Find the room
        room = next((r for r in rooms if r["room_id"] == room_id), None)
        if not room:
            logger.warning(f"Room {room_id} not found for opening")
            continue
        
        poly = room["polygon_points"]
        wall_side = get_closest_wall(room, (x, y), poly)
        
        # Find the best matching wall
        best_wall = None
        best_distance = float('inf')
        
        for wall in walls:
            p1 = wall["p1"]
            p2 = wall["p2"]
            
            # Check if this wall belongs to the room
            if room_id not in wall["room_ids"]:
                continue
            
            # Distance from opening center to wall
            dist = point_to_segment_distance((x, y), (p1[0], p1[1]), (p2[0], p2[1]))
            
            if dist < best_distance:
                best_distance = dist
                best_wall = wall
        
        if best_wall and best_distance < 100:  # Within 100 pixels
            best_wall["openings"].append({
                "type": opening_type,
                "x": x,
                "y": y,
                "width_px": opening.get("width_px", 40),
                "opening_id": opening.get("opening_id")
            })
            logger.info(f"Assigned {opening_type} #{opening.get('opening_id')} to wall in room {room_id}")
        else:
            logger.warning(f"Could not assign {opening_type} to wall - distance: {best_distance}")
    
    return walls


def get_closest_wall(room: Dict, point: Tuple, polygon: List) -> str:
    """
    Determine which wall side a point is closest to
    """
    x, y = point
    xs = [p[0] for p in polygon]
    ys = [p[1] for p in polygon]
    
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    # Calculate distances to each wall
    dist_top = abs(y - min_y)
    dist_bottom = abs(y - max_y)
    dist_left = abs(x - min_x)
    dist_right = abs(x - max_x)
    
    distances = {
        "top": dist_top,
        "bottom": dist_bottom,
        "left": dist_left,
        "right": dist_right
    }
    
    return min(distances, key=distances.get)


def point_to_segment_distance(point: Tuple, p1: Tuple, p2: Tuple) -> float:
    """Calculate perpendicular distance from point to line segment"""
    px, py = point
    x1, y1 = p1
    x2, y2 = p2
    
    dx = x2 - x1
    dy = y2 - y1
    
    if dx == 0 and dy == 0:
        return ((px - x1)**2 + (py - y1)**2)**0.5
    
    t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx*dx + dy*dy)))
    
    closest_x = x1 + t * dx
    closest_y = y1 + t * dy
    
    return ((px - closest_x)**2 + (py - closest_y)**2)**0.5
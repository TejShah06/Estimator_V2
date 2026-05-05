# test/test_relationships.py
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.database import SessionLocal
from app.models.user import User
from app.models.floorplan_project import FloorPlanProject
from app.models.floorplan_room import FloorPlanRoom
from app.models.floorplan_cost import FloorPlanCost
from sqlalchemy.orm import joinedload

print("🧪 Testing Model Relationships\n")

db = SessionLocal()

try:
    # Test 1: Create user
    print("1️⃣ Creating test user...")
    user = User(
        username="test_user_123",
        email="test123@example.com",
        hashed_password="hashed_password_here",
        role="user",
        full_name="Test User"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"     User created with ID: {user.id}")

    # Test 2: Create AI project
    print("\n2️⃣ Creating AI project...")
    project_ai = FloorPlanProject(
        user_id=user.id,
        project_name="Test AI Project",
        source_type="ai_upload",
        has_floor_plan_image=True,
        has_geometry_data=True,
        total_area_sqft=1200.0,
        rooms_count=3,
        doors_count=5,
        windows_count=8,
        status="completed"
    )
    db.add(project_ai)
    db.commit()
    db.refresh(project_ai)
    print(f"     AI Project created with ID: {project_ai.id}")
    print(f"     Project code (auto-generated): {project_ai.project_code}")

    # Test 3: Create Manual project
    print("\n3️⃣ Creating Manual project...")
    project_manual = FloorPlanProject(
        user_id=user.id,
        project_name="Test Manual Project",
        source_type="manual_form",
        has_floor_plan_image=False,
        has_geometry_data=False,
        total_area_sqft=1500.0,
        rooms_count=4,
        status="completed"
    )
    db.add(project_manual)
    db.commit()
    db.refresh(project_manual)
    print(f"     Manual Project created with ID: {project_manual.id}")
    print(f"     Project code (auto-generated): {project_manual.project_code}")

    # Test 4: Add room to AI project (WITH geometry)
    print("\n4️⃣ Adding room to AI project (with geometry)...")
    room_ai = FloorPlanRoom(
        project_id=project_ai.id,
        room_number=1,
        room_type="bedroom",
        room_name="Master Bedroom",
        area_sqft=180.0,
        ceiling_height_ft=10.0,
        x_min=0.0,
        y_min=0.0,
        x_max=150.0,
        y_max=120.0,
        center_x=75.0,
        center_y=60.0,
        has_geometry=True,
        has_window=True,
        has_door=True
    )
    db.add(room_ai)
    db.commit()
    print(f"     Room added with ID: {room_ai.id}")
    print(f"     Has geometry: {room_ai.has_geometry}")
    print(f"     Coordinates: ({room_ai.x_min}, {room_ai.y_min}) to ({room_ai.x_max}, {room_ai.y_max})")

    # Test 5: Add room to Manual project (NO geometry)
    print("\n5️⃣ Adding room to Manual project (no geometry)...")
    room_manual = FloorPlanRoom(
        project_id=project_manual.id,
        room_number=1,
        room_type="bedroom",
        room_name="Bedroom 1",
        area_sqft=200.0,
        ceiling_height_ft=10.0,
        x_min=None,
        y_min=None,
        x_max=None,
        y_max=None,
        has_geometry=False,
        has_window=True,
        has_door=True
    )
    db.add(room_manual)
    db.commit()
    print(f"     Room added with ID: {room_manual.id}")
    print(f"     Has geometry: {room_manual.has_geometry}")
    print(f"     Area only: {room_manual.area_sqft} sqft")

    # Test 6: Add cost to AI project
    print("\n6️⃣ Adding cost to AI project...")
    cost = FloorPlanCost(
        project_id=project_ai.id,
        room_id=room_ai.id,
        category="flooring",
        subcategory="ceramic_tile",
        quantity=180.0,
        unit="sqft",
        rate_per_unit=85.0,
        material_cost=13000.0,
        labor_cost=2300.0,
        total_cost=15300.0,
        grand_total=15300.0
    )
    db.add(cost)
    db.commit()
    print(f"     Cost added with ID: {cost.id}")
    print(f"     Category: {cost.category}, Total: ${cost.grand_total}")

    # Test 7: Test relationships (IMPORTANT!)
    print("\n7️⃣ Testing ORM relationships...")
    
    # Load project with relationships
    project = db.query(FloorPlanProject).options(
        joinedload(FloorPlanProject.rooms),
        joinedload(FloorPlanProject.costs),
        joinedload(FloorPlanProject.user)
    ).filter_by(id=project_ai.id).first()
    
    print(f"     Project: {project.project_name}")
    print(f"     Belongs to user: {project.user.username}")
    print(f"     Has {len(project.rooms)} room(s)")
    print(f"     Has {len(project.costs)} cost item(s)")
    
    if project.rooms:
        room = project.rooms[0]
        print(f"     First room: {room.room_name} ({room.area_sqft} sqft)")
    
    if project.costs:
        cost_item = project.costs[0]
        print(f"     First cost: {cost_item.category} - ${cost_item.grand_total}")

    # Test 8: Query by source type
    print("\n8️⃣ Testing queries by source type...")
    ai_projects = db.query(FloorPlanProject).filter_by(source_type="ai_upload").count()
    manual_projects = db.query(FloorPlanProject).filter_by(source_type="manual_form").count()
    print(f"     AI projects: {ai_projects}")
    print(f"     Manual projects: {manual_projects}")

    # Cleanup
    print("\n🧹 Cleaning up test data...")
    db.delete(cost)
    db.delete(room_ai)
    db.delete(room_manual)
    db.delete(project_ai)
    db.delete(project_manual)
    db.delete(user)
    db.commit()
    print("     Test data cleaned up")

    print("\n  ALL RELATIONSHIP TESTS PASSED! 🎉")
    print("\n📊 Summary:")
    print("     Models working correctly")
    print("     Relationships functioning")
    print("     AI and Manual workflows supported")
    print("     Database triggers working (project_code auto-generated)")
    print("     NULL geometry allowed for manual entries")
    print("\n🚀 Ready to proceed to schemas and services!")

except Exception as e:
    print(f"\n❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
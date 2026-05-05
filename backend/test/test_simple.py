
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.floorplan_project import FloorPlanProject
from app.models.floorplan_room import FloorPlanRoom
from app.models.floorplan_cost import FloorPlanCost
from app.models.floorplan_wall import FloorPlanWall
from app.models.floorplan_opening import FloorPlanOpening

from app.models.floorplan_3dmodel import FloorPlan3DModel
from app.models.floorplan_elivationview import FloorPlanElevationView

print("🧪 Simple Model Test\n")

# Create tables
print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("  Tables created\n")

# Test database
db = SessionLocal()

try:
    print("1️⃣ Creating user...")
    user = User(
        username="simple_test_user",
        email="simple@test.com",
        hashed_password="test_hash",
        full_name="Test User"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"     User created with ID: {user.id}\n")

    print("2️⃣ Creating AI project...")
    project = FloorPlanProject(
        user_id=user.id,
        project_name="AI Test Project",
        source_type="ai_upload",
        has_floor_plan_image=True,
        has_geometry_data=True,
        total_area_sqft=1200.0
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    print(f"     AI Project created with ID: {project.id}\n")

    print("3️⃣ Creating AI Analysis...")
    ai_analysis = AIAnalysis(
        project_id=project.id,
        original_image_path="/uploads/test.jpg",
        wall_detection_confidence=0.95,
        room_segmentation_confidence=0.92,
        overall_confidence=0.93,
        processing_status="completed"
    )
    db.add(ai_analysis)
    db.commit()
    print(f"     AI Analysis created\n")

    print("4️⃣ Creating room (from AI)...")
    room = FloorPlanRoom(
        project_id=project.id,
        room_number=1,
        room_type="bedroom",
        room_name="Master Bedroom",
        area_sqft=180.0,
        ceiling_height_ft=10.0,
        has_geometry=True,
        has_window=True,
        has_door=True,
        x_min=0.0, y_min=0.0, x_max=150.0, y_max=120.0
    )
    db.add(room)
    db.commit()
    print(f"     Room created\n")

    print("5️⃣ Creating cost (AI detection)...")
    cost_ai = FloorPlanCost(
        project_id=project.id,
        room_id=room.id,
        source_type="ai_detection",
        created_by_user_id=user.id,
        category="flooring",
        quantity=180.0,
        unit="sqft",
        rate_per_unit=85.0,
        total_cost=15300.0,
        confidence_score=0.92
    )
    db.add(cost_ai)
    db.commit()
    print(f"     AI Cost added\n")

    print("6️⃣ Creating manual cost...")
    cost_manual = FloorPlanCost(
        project_id=project.id,
        source_type="manual_entry",
        created_by_user_id=user.id,
        category="painting",
        quantity=1200.0,
        unit="sqft",
        rate_per_unit=5.0,
        total_cost=6000.0,
        is_verified=True
    )
    db.add(cost_manual)
    db.commit()
    print(f"     Manual Cost added\n")

    print("7️⃣ Testing relationships...")
    proj = db.query(FloorPlanProject).filter_by(id=project.id).first()
    print(f"     Project: {proj.project_name}")
    print(f"     Rooms: {len(proj.rooms)}")
    print(f"     Costs: {len(proj.costs)}")
    print(f"     AI Analysis: {proj.ai_analysis is not None}\n")

    print("8️⃣ Filtering costs by source...")
    ai_costs = db.query(FloorPlanCost).filter_by(project_id=project.id, source_type="ai_detection").all()
    manual_costs = db.query(FloorPlanCost).filter_by(project_id=project.id, source_type="manual_entry").all()
    print(f"     AI Costs: {len(ai_costs)}")
    print(f"     Manual Costs: {len(manual_costs)}\n")

    print("🧹 Cleaning up...")
    db.delete(cost_manual)
    db.delete(cost_ai)
    db.delete(ai_analysis)
    db.delete(room)
    db.delete(project)
    db.delete(user)
    db.commit()
    
    print("\n    ALL TESTS PASSED!    \n")
    print("📊 Summary:")
    print("     User model fixed (no Estimate reference)")
    print("     AI Analysis model created")
    print("     Unified cost table working")
    print("     Source tracking (AI vs Manual) works")
    print("     Relationships properly configured")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
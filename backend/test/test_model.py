
import sys
from pathlib import Path

# Add parent directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.database import engine, SessionLocal, Base
from app.db.base import *  # This imports all models
from sqlalchemy import text  # FIX: Import text for raw SQL

# Test 1: Create tables
print("🔧 Creating tables from models...")
try:
    Base.metadata.create_all(bind=engine)
    print("  Tables created/verified successfully!")
except Exception as e:
    print(f"❌ Error creating tables: {e}")
    sys.exit(1)

# Test 2: Test database connection (FIXED)
print("\n📊 Testing database connection...")
try:
    db = SessionLocal()
    result = db.execute(text("SELECT 1"))  # FIX: Wrap in text()
    print("  Database connection successful!")
    db.close()
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Check if tables exist in database
print("\n📋 Checking tables in database...")
try:
    db = SessionLocal()
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    expected_tables = [
        'users',
        'estimates',
        'floorplan_projects',
        'floorplan_rooms',
        'floorplan_openings',
        'floorplan_walls',
        'floorplan_costs',
        'floorplan_3d_models',
        'floorplan_elevation_views'
    ]
    
    print("Tables found in database:")
    for table in expected_tables:
        if table in tables:
            print(f"    {table}")
        else:
            print(f"  ❌ {table} - MISSING!")
    
    # Show actual table count
    print(f"\n📊 Total tables in database: {len(tables)}")
    
    db.close()
except Exception as e:
    print(f"❌ Error checking tables: {e}")
    import traceback
    traceback.print_exc()

print("\n🎉 Basic model test complete!")
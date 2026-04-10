from dotenv import load_dotenv
import os
import psycopg2

load_dotenv()

try:
    conn = psycopg2.connect(
        host="localhost",
        database="estimator_db",
        user="postgres",
        password="root"  # Replace with actual password
    )
    print("✅ Connection successful!")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
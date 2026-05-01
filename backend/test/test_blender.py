# test_blender.py
import os
from dotenv import load_dotenv

load_dotenv()

# Use the correct path
blender_path = os.getenv("BLENDER_PATH", r"D:\Blender\blender.exe")

print(f"Testing Blender at: {blender_path}")
print(f"Exists: {os.path.exists(blender_path)}")

if os.path.exists(blender_path):
    import subprocess
    try:
        result = subprocess.run(
            [blender_path, "--version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        print(f"✓ Success!")
        print(f"Output: {result.stdout}")
        print(f"Errors: {result.stderr}")
    except Exception as e:
        print(f"✗ Error: {e}")
else:
    print(f"✗ Blender not found at: {blender_path}")
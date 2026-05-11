import requests

BASE_URL = "http://localhost:8000"

test_users = [
    {
        "username": f"loadtest_user{i}",
        "email":    f"loadtest{i}@test.com",
        "password": "LoadTest@123"
    }
    for i in range(6, 17)  # 10 test users
]

print("Creating test users...\n")

success = 0
for user in test_users:
    try:
        res = requests.post(f"{BASE_URL}/auth/register", json=user)
        if res.status_code == 200:
            print(f"✅ Created: {user['email']}")
            success += 1
        else:
            detail = res.json().get("detail", "Unknown error")
            print(f"⚠️  Skipped: {user['email']} → {detail}")
    except Exception as e:
        print(f"❌ Error: {user['email']} → {e}")

print(f"\nDone: {success}/{len(test_users)} users created")
print("Password for all: LoadTest@123")
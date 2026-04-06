import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_flow():
    print("--- Starting E2E Verification Script ---")
    
    # 1. Register User A (Teacher)
    u1 = {"name": "Teacher Alpha", "email": "alpha@test.com", "password": "password123"}
    r = requests.post(f"{BASE_URL}/auth/register", json=u1)
    print(f"Register User A: {r.status_code}")
    
    # 2. Login User A
    login_data = {"username": "alpha@test.com", "password": "password123"}
    r = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    token_a = r.json()["access_token"]
    print(f"Login User A: {r.status_code}")
    
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    # 3. Create Classroom
    room = {"name": "Advanced AI Lab"}
    r = requests.post(f"{BASE_URL}/classrooms", json=room, headers=headers_a)
    room_data = r.json()
    join_code = room_data["join_code"]
    print(f"Create Classroom: {r.status_code} | Code: {join_code}")
    
    # 4. Register User B (Student)
    u2 = {"name": "Student Beta", "email": "beta@test.com", "password": "password123"}
    r = requests.post(f"{BASE_URL}/auth/register", json=u2)
    print(f"Register User B: {r.status_code}")
    
    # 5. Login User B
    r = requests.post(f"{BASE_URL}/auth/login", data=login_data := {"username": "beta@test.com", "password": "password123"})
    token_b = r.json()["access_token"]
    print(f"Login User B: {r.status_code}")
    
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    # 6. Join Classroom
    join = {"join_code": join_code}
    r = requests.post(f"{BASE_URL}/classrooms/join", json=join, headers=headers_b)
    print(f"Join Classroom: {r.status_code} | {r.json().get('message')}")
    
    # 7. Verify List for User B
    r = requests.get(f"{BASE_URL}/classrooms", headers=headers_b)
    rooms = r.json()
    print(f"User B Classrooms: {[rm['name'] for rm in rooms]}")
    
    if "Advanced AI Lab" in [rm['name'] for rm in rooms]:
        print("--- SUCCESS: Core Flow Verified ---")
    else:
        print("--- FAILURE: Classroom not found in student list ---")

if __name__ == "__main__":
    test_flow()

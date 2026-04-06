#!/usr/bin/env python3
"""
Test script for authentication endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_register():
    """Test user registration"""
    try:
        user_data = {
            "fullName": "Test User",
            "email": "test@example.com",
            "password": "password123"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        print(f"Register: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Registration failed: {e}")
        return False

def test_login():
    """Test user login"""
    try:
        login_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Login failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing authentication endpoints...")
    print("=" * 50)
    
    # Test health
    if test_health():
        print("✅ Health check passed")
    else:
        print("❌ Health check failed")
        exit(1)
    
    print()
    
    # Test registration
    if test_register():
        print("✅ Registration passed")
    else:
        print("❌ Registration failed")
    
    print()
    
    # Test login
    if test_login():
        print("✅ Login passed")
    else:
        print("❌ Login failed")
    
    print("=" * 50)
    print("Testing complete!")

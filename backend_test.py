#!/usr/bin/env python3
"""
IMS 2.0 - Backend API Testing Suite
===================================
Comprehensive testing of all backend endpoints
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class IMSBackendTester:
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
            
        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {"status": "success", "data": response.text}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}
                
        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}
    
    def test_health_endpoints(self):
        """Test basic health and info endpoints"""
        self.log("🏥 Testing Health Endpoints", "SECTION")
        
        # Test root endpoint
        self.run_test("Root Endpoint", "GET", "/", 200)
        
        # Test health check
        self.run_test("Health Check", "GET", "/health", 200)
        
        # Test API docs
        self.run_test("API Docs", "GET", "/docs", 200)
        
    def test_authentication(self):
        """Test authentication endpoints"""
        self.log("🔐 Testing Authentication", "SECTION")
        
        # Test login with superadmin credentials
        login_data = {
            "username": "superadmin",
            "password": "Super@123"
        }
        
        success, response = self.run_test(
            "Superadmin Login", 
            "POST", 
            "/api/v1/auth/login", 
            200, 
            login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            self.log(f"✅ Authentication successful - User: {self.user_data.get('username', 'Unknown')}")
            
            # Test get current user
            self.run_test("Get Current User", "GET", "/api/v1/auth/me", 200)
            
            # Test token refresh
            refresh_data = {"token": self.token}
            self.run_test("Refresh Token", "POST", "/api/v1/auth/refresh", 200, refresh_data)
            
        else:
            self.log("❌ Authentication failed - cannot proceed with authenticated tests")
            return False
            
        return True
    
    def test_stores_management(self):
        """Test stores management endpoints"""
        self.log("🏪 Testing Stores Management", "SECTION")
        
        # List stores
        self.run_test("List Stores", "GET", "/api/v1/stores/", 200)
        
        # Create a test store
        store_data = {
            "store_code": "TEST01",
            "store_name": "Test Store",
            "brand": "BETTER_VISION",
            "address": "123 Test Street",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456",
            "phone": "9876543210",
            "email": "test@store.com",
            "gstin": "TEST123456789"
        }
        
        success, response = self.run_test(
            "Create Store", 
            "POST", 
            "/api/v1/stores/", 
            201, 
            store_data
        )
        
        if success and 'store_id' in response:
            store_id = response['store_id']
            
            # Get store details
            self.run_test("Get Store Details", "GET", f"/api/v1/stores/{store_id}", 200)
            
            # Update store
            update_data = {"store_name": "Updated Test Store"}
            self.run_test("Update Store", "PUT", f"/api/v1/stores/{store_id}", 200, update_data)
            
    def test_users_management(self):
        """Test users management endpoints"""
        self.log("👥 Testing Users Management", "SECTION")
        
        # List users
        self.run_test("List Users", "GET", "/api/v1/users/", 200)
        
        # Create a test user
        user_data = {
            "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
            "email": "testuser@example.com",
            "password": "TestPass123!",
            "full_name": "Test User",
            "phone": "9876543210",
            "roles": ["SALES_STAFF"],
            "store_ids": [],
            "discount_cap": 10.0
        }
        
        success, response = self.run_test(
            "Create User", 
            "POST", 
            "/api/v1/users/", 
            201, 
            user_data
        )
        
        if success and 'user_id' in response:
            user_id = response['user_id']
            
            # Get user details
            self.run_test("Get User Details", "GET", f"/api/v1/users/{user_id}", 200)
            
    def test_settings_endpoints(self):
        """Test settings endpoints"""
        self.log("⚙️ Testing Settings", "SECTION")
        
        # Test categories
        self.run_test("List Categories", "GET", "/api/v1/settings/categories", 200)
        
        # Test brands
        self.run_test("List Brands", "GET", "/api/v1/settings/brands", 200)
        
        # Test lens prices
        self.run_test("List Lens Prices", "GET", "/api/v1/settings/lens-prices", 200)
        
        # Test discount rules
        self.run_test("Get Discount Rules", "GET", "/api/v1/settings/discount-rules", 200)
        
        # Test integrations
        self.run_test("List Integrations", "GET", "/api/v1/settings/integrations", 200)
        
        # Test system settings
        self.run_test("Get System Settings", "GET", "/api/v1/settings/system", 200)
        
    def test_inventory_endpoints(self):
        """Test inventory endpoints"""
        self.log("📦 Testing Inventory", "SECTION")
        
        # Test inventory list (may be empty)
        self.run_test("List Inventory", "GET", "/api/v1/inventory/", 200)
        
        # Test low stock
        self.run_test("Get Low Stock", "GET", "/api/v1/inventory/low-stock", 200)
        
    def test_customers_endpoints(self):
        """Test customers endpoints"""
        self.log("👤 Testing Customers", "SECTION")
        
        # Test customers list
        self.run_test("List Customers", "GET", "/api/v1/customers/", 200)
        
        # Test customer search
        self.run_test("Search Customers", "GET", "/api/v1/customers/search?q=test", 200)
        
    def test_orders_endpoints(self):
        """Test orders endpoints"""
        self.log("🛒 Testing Orders", "SECTION")
        
        # Test orders list
        self.run_test("List Orders", "GET", "/api/v1/orders/", 200)
        
    def test_reports_endpoints(self):
        """Test reports endpoints"""
        self.log("📊 Testing Reports", "SECTION")
        
        # Test dashboard stats (may fail if no store context)
        self.run_test("Dashboard Stats", "GET", "/api/v1/reports/dashboard-stats", 200)
        
    def test_workshop_endpoints(self):
        """Test workshop endpoints"""
        self.log("🔧 Testing Workshop", "SECTION")
        
        # Test jobs list
        self.run_test("List Jobs", "GET", "/api/v1/workshop/jobs", 200)
        
    def test_hr_endpoints(self):
        """Test HR endpoints"""
        self.log("👔 Testing HR", "SECTION")
        
        # Test employees list
        self.run_test("List Employees", "GET", "/api/v1/hr/employees", 200)
        
    def run_all_tests(self):
        """Run all test suites"""
        self.log("🚀 Starting IMS 2.0 Backend API Tests", "START")
        
        # Test basic endpoints first
        self.test_health_endpoints()
        
        # Test authentication (required for other tests)
        if not self.test_authentication():
            self.log("❌ Authentication failed - skipping authenticated tests")
            return
            
        # Test all authenticated endpoints
        self.test_stores_management()
        self.test_users_management()
        self.test_settings_endpoints()
        self.test_inventory_endpoints()
        self.test_customers_endpoints()
        self.test_orders_endpoints()
        self.test_reports_endpoints()
        self.test_workshop_endpoints()
        self.test_hr_endpoints()
        
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        self.log("📋 Test Summary", "SUMMARY")
        self.log(f"Tests Run: {self.tests_run}")
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Tests Failed: {len(self.failed_tests)}")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            self.log("❌ Failed Tests:", "ERROR")
            for failure in self.failed_tests:
                self.log(f"  - {failure.get('test', 'Unknown')}: {failure.get('error', failure.get('response', 'Unknown error'))}")
        
        return len(self.failed_tests) == 0

def main():
    """Main test runner"""
    tester = IMSBackendTester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        tester.log("Tests interrupted by user")
        return 1
    except Exception as e:
        tester.log(f"Test runner error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
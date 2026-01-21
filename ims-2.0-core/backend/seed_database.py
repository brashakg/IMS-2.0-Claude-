"""
IMS 2.0 - Database Seed Script
===============================
Seeds the database with test users, stores, and products
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# MongoDB connection
MONGODB_URL = "mongodb://localhost:27017"
MONGODB_DB = "ims2"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


async def seed_database():
    """Seed the database with test data"""
    print("🌱 Seeding IMS 2.0 Database...")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]
    
    try:
        # 1. Create Test Stores
        print("\n📍 Creating Test Stores...")
        stores = [
            {
                "store_id": "store-bv-001",
                "store_code": "BV-001",
                "store_name": "Beauty Vision - Indiranagar",
                "brand": "BETTER_VISION",
                "address": "100 Feet Road, Indiranagar",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560038",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "geo_fence_radius_meters": 500,
                "phone": "+91-80-12345678",
                "is_hq": False,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "enabled_categories": ["FRAME", "SUNGLASS", "OPTICAL_LENS", "CONTACT_LENS", "ACCESSORIES"]
            },
            {
                "store_id": "store-bv-002",
                "store_code": "BV-002",
                "store_name": "Beauty Vision - Koramangala",
                "brand": "BETTER_VISION",
                "address": "5th Block, Koramangala",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560095",
                "latitude": 12.9352,
                "longitude": 77.6245,
                "geo_fence_radius_meters": 500,
                "phone": "+91-80-23456789",
                "is_hq": False,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "enabled_categories": ["FRAME", "SUNGLASS", "OPTICAL_LENS", "CONTACT_LENS", "ACCESSORIES"]
            },
            {
                "store_id": "store-hq",
                "store_code": "HQ",
                "store_name": "Headquarters",
                "brand": "BETTER_VISION",
                "address": "Corporate Office, MG Road",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560001",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "geo_fence_radius_meters": 1000,
                "phone": "+91-80-11111111",
                "is_hq": True,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "enabled_categories": ["FRAME", "SUNGLASS", "OPTICAL_LENS", "CONTACT_LENS", "ACCESSORIES"]
            }
        ]
        
        await db.stores.delete_many({})  # Clear existing
        await db.stores.insert_many(stores)
        print(f"✅ Created {len(stores)} stores")
        
        # 2. Create Test Users
        print("\n👥 Creating Test Users...")
        users = [
            {
                "user_id": "user-superadmin",
                "username": "superadmin",
                "email": "superadmin@beautyvision.in",
                "password_hash": hash_password("Super@2024!Vision"),
                "full_name": "Super Admin",
                "roles": ["SUPERADMIN"],
                "active_store_id": None,
                "accessible_stores": [],  # All stores
                "discount_cap_percent": 100,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "user_id": "user-admin",
                "username": "admin",
                "email": "admin@beautyvision.in",
                "password_hash": hash_password("Admin@2024!BV"),
                "full_name": "Admin User",
                "roles": ["ADMIN"],
                "active_store_id": None,
                "accessible_stores": [],  # All stores
                "discount_cap_percent": 100,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "user_id": "user-area-manager",
                "username": "areamanager",
                "email": "area.manager@beautyvision.in",
                "password_hash": hash_password("Area@2024!Manager"),
                "full_name": "Area Manager",
                "roles": ["AREA_MANAGER"],
                "active_store_id": "store-bv-001",
                "accessible_stores": ["store-bv-001", "store-bv-002"],
                "discount_cap_percent": 25,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "user_id": "user-store-manager",
                "username": "storemanager",
                "email": "store.manager@beautyvision.in",
                "password_hash": hash_password("Store@2024!Manager"),
                "full_name": "Store Manager",
                "roles": ["STORE_MANAGER"],
                "active_store_id": "store-bv-001",
                "accessible_stores": ["store-bv-001"],
                "discount_cap_percent": 20,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "user_id": "user-cashier",
                "username": "cashier",
                "email": "cashier@beautyvision.in",
                "password_hash": hash_password("Cashier@2024!BV"),
                "full_name": "Sales Cashier",
                "roles": ["SALES_CASHIER"],
                "active_store_id": "store-bv-001",
                "accessible_stores": ["store-bv-001"],
                "discount_cap_percent": 10,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "user_id": "user-sales",
                "username": "sales",
                "email": "sales@beautyvision.in",
                "password_hash": hash_password("Sales@2024!Staff"),
                "full_name": "Sales Staff",
                "roles": ["SALES_STAFF"],
                "active_store_id": "store-bv-001",
                "accessible_stores": ["store-bv-001"],
                "discount_cap_percent": 10,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "user_id": "user-optometrist",
                "username": "optometrist",
                "email": "optometrist@beautyvision.in",
                "password_hash": hash_password("Opto@2024!BV"),
                "full_name": "Optometrist",
                "roles": ["OPTOMETRIST"],
                "active_store_id": "store-bv-001",
                "accessible_stores": ["store-bv-001"],
                "discount_cap_percent": 10,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "user_id": "user-catalog",
                "username": "catalog",
                "email": "catalog@beautyvision.in",
                "password_hash": hash_password("Catalog@2024!Manager"),
                "full_name": "Catalog Manager",
                "roles": ["CATALOG_MANAGER"],
                "active_store_id": "store-hq",
                "accessible_stores": ["store-bv-001", "store-bv-002", "store-hq"],
                "discount_cap_percent": 0,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "user_id": "user-workshop",
                "username": "workshop",
                "email": "workshop@beautyvision.in",
                "password_hash": hash_password("Workshop@2024!Staff"),
                "full_name": "Workshop Staff",
                "roles": ["WORKSHOP_STAFF"],
                "active_store_id": "store-bv-001",
                "accessible_stores": ["store-bv-001"],
                "discount_cap_percent": 0,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "user_id": "user-accountant",
                "username": "accountant",
                "email": "accountant@beautyvision.in",
                "password_hash": hash_password("Account@2024!BV"),
                "full_name": "Accountant",
                "roles": ["ACCOUNTANT"],
                "active_store_id": "store-hq",
                "accessible_stores": [],  # All stores
                "discount_cap_percent": 0,
                "is_active": True,
                "created_at": datetime.utcnow()
            }
        ]
        
        await db.users.delete_many({})  # Clear existing
        await db.users.insert_many(users)
        print(f"✅ Created {len(users)} users")
        
        # 3. Create Sample Products
        print("\n📦 Creating Sample Products...")
        products = [
            {
                "product_id": "prod-frame-001",
                "barcode": "BV-FRAME-001",
                "name": "Ray-Ban Wayfarer",
                "category": "FRAME",
                "subcategory": "MASS",
                "brand": "Ray-Ban",
                "mrp": 5000,
                "offer_price": None,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "product_id": "prod-frame-002",
                "barcode": "BV-FRAME-002",
                "name": "Oakley Holbrook",
                "category": "FRAME",
                "subcategory": "PREMIUM",
                "brand": "Oakley",
                "mrp": 8500,
                "offer_price": None,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "product_id": "prod-sun-001",
                "barcode": "BV-SUN-001",
                "name": "Ray-Ban Aviator",
                "category": "SUNGLASS",
                "subcategory": "MASS",
                "brand": "Ray-Ban",
                "mrp": 6500,
                "offer_price": None,
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "product_id": "prod-cl-001",
                "barcode": "BV-CL-001",
                "name": "Acuvue Oasys",
                "category": "CONTACT_LENS",
                "subcategory": "MASS",
                "brand": "Acuvue",
                "mrp": 1200,
                "offer_price": None,
                "is_active": True,
                "created_at": datetime.utcnow()
            }
        ]
        
        await db.products.delete_many({})  # Clear existing
        await db.products.insert_many(products)
        print(f"✅ Created {len(products)} products")
        
        # 4. Create Sample Stock
        print("\n📊 Creating Sample Stock...")
        stock_items = [
            {
                "stock_id": "stock-001",
                "product_id": "prod-frame-001",
                "store_id": "store-bv-001",
                "quantity": 50,
                "reserved_quantity": 0,
                "batch_number": "BATCH-001",
                "created_at": datetime.utcnow()
            },
            {
                "stock_id": "stock-002",
                "product_id": "prod-frame-002",
                "store_id": "store-bv-001",
                "quantity": 30,
                "reserved_quantity": 0,
                "batch_number": "BATCH-002",
                "created_at": datetime.utcnow()
            },
            {
                "stock_id": "stock-003",
                "product_id": "prod-sun-001",
                "store_id": "store-bv-001",
                "quantity": 40,
                "reserved_quantity": 0,
                "batch_number": "BATCH-003",
                "created_at": datetime.utcnow()
            }
        ]
        
        await db.stock.delete_many({})  # Clear existing
        await db.stock.insert_many(stock_items)
        print(f"✅ Created {len(stock_items)} stock items")
        
        print("\n" + "=" * 60)
        print("✅ Database seeding completed successfully!")
        print("=" * 60)
        
        print("\n📝 Test User Credentials:")
        print("-" * 60)
        for user in users:
            print(f"Email: {user['email']}")
            print(f"Role: {', '.join(user['roles'])}")
            print(f"Password: (see TEST_CREDENTIALS.md)")
            print("-" * 60)
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())

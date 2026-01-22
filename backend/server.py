"""
IMS 2.0 - Server Entry Point
============================
"""
from api.main import app

# This file serves as the entry point for the FastAPI application
# The actual app is defined in api/main.py

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

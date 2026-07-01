from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

# Razorpay payment endpoints
from payments import router as payments_router  # noqa: E402
app.include_router(payments_router)

# Admin panel API endpoints
from admin_routes import router as admin_router  # noqa: E402
app.include_router(admin_router)

# Cart API endpoints
from cart_routes import router as cart_router  # noqa: E402
app.include_router(cart_router)

# Seed data API endpoints
from seed_routes import router as seed_router  # noqa: E402
app.include_router(seed_router)

# Booking flow API endpoints (Urban Company-style)
from booking_routes import router as booking_router  # noqa: E402
app.include_router(booking_router)

# MSG91 WhatsApp OTP authentication
from otp_routes import router as otp_router  # noqa: E402
app.include_router(otp_router)

# CMS admin routes (Urban Company-style content management)
from cms_routes import router as cms_router  # noqa: E402
app.include_router(cms_router)

# Service detail editor (per-service editable detail + variants + reviews)
from service_detail_routes import router as service_detail_router  # noqa: E402
app.include_router(service_detail_router, prefix="/api")

# Live location (Phase 2): provider GPS upload + customer fetch
from live_location_routes import router as live_location_router  # noqa: E402
app.include_router(live_location_router)

# Public booking lookup (read-only, by ID) — service-role bypass for RLS
from booking_public_routes import router as booking_public_router  # noqa: E402
app.include_router(booking_public_router)

# Welcome screen CMS (admin-editable text/toggles/colors/hero image)
from welcome_cms_routes import router as welcome_cms_router  # noqa: E402
app.include_router(welcome_cms_router)

from instahelp_cms_routes import router as instahelp_cms_router  # noqa: E402
app.include_router(instahelp_cms_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

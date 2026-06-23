"""
Cart API Routes for Mfixit App
Handles cart operations - add, remove, update, clear
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx

router = APIRouter(prefix="/api/cart", tags=["cart"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

def get_supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

# Models
class CartItemCreate(BaseModel):
    service_id: str
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: str
    user_id: str
    service_id: str
    service_title: Optional[str] = None
    service_image: Optional[str] = None
    service_price: Optional[float] = None
    quantity: int
    created_at: Optional[str] = None

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total: float
    item_count: int

# Helper to get user_id from auth token
async def get_user_id_from_token(authorization: str) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {token}"
            }
        )
        
        if response.status_code == 200:
            auth_user = response.json()
            auth_user_id = auth_user.get("id")
            
            # Get user_id from users table
            user_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users?auth_user_id=eq.{auth_user_id}&select=id",
                headers=get_supabase_headers()
            )
            
            if user_response.status_code == 200:
                users = user_response.json()
                if users:
                    return users[0].get("id")
    return None

@router.get("", response_model=CartResponse)
async def get_cart(authorization: str = Header(None)):
    """Get user's cart with items and total"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    user_id = await get_user_id_from_token(authorization) if authorization else None
    
    if not user_id:
        # Return empty cart for anonymous users
        return CartResponse(items=[], total=0, item_count=0)
    
    async with httpx.AsyncClient() as client:
        # Get cart items
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/cart_items?user_id=eq.{user_id}&select=*",
            headers=get_supabase_headers()
        )
        
        if response.status_code != 200:
            return CartResponse(items=[], total=0, item_count=0)
        
        cart_items = response.json()
        
        if not cart_items:
            return CartResponse(items=[], total=0, item_count=0)
        
        # Get service details
        service_ids = [item["service_id"] for item in cart_items]
        service_ids_str = ",".join([f'"{sid}"' for sid in service_ids])
        
        svc_response = await client.get(
            f"{SUPABASE_URL}/rest/v1/services?id=in.({service_ids_str})&select=id,title,image,starting_price",
            headers=get_supabase_headers()
        )
        
        services = {}
        if svc_response.status_code == 200:
            for s in svc_response.json():
                services[s["id"]] = s
        
        items = []
        total = 0
        
        for item in cart_items:
            svc = services.get(item["service_id"], {})
            price = float(svc.get("starting_price", 0))
            quantity = item.get("quantity", 1)
            
            items.append(CartItemResponse(
                id=item["id"],
                user_id=item["user_id"],
                service_id=item["service_id"],
                service_title=svc.get("title"),
                service_image=svc.get("image"),
                service_price=price,
                quantity=quantity,
                created_at=item.get("created_at")
            ))
            
            total += price * quantity
        
        return CartResponse(
            items=items,
            total=total,
            item_count=sum(item.quantity for item in items)
        )

@router.post("/add", response_model=CartItemResponse)
async def add_to_cart(item: CartItemCreate, authorization: str = Header(None)):
    """Add item to cart or update quantity if exists"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    user_id = await get_user_id_from_token(authorization) if authorization else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Please sign in to add items to cart")
    
    async with httpx.AsyncClient() as client:
        # Check if item already in cart
        existing_response = await client.get(
            f"{SUPABASE_URL}/rest/v1/cart_items?user_id=eq.{user_id}&service_id=eq.{item.service_id}",
            headers=get_supabase_headers()
        )
        
        if existing_response.status_code == 200:
            existing = existing_response.json()
            
            if existing:
                # Update quantity
                new_quantity = existing[0]["quantity"] + item.quantity
                update_response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/cart_items?id=eq.{existing[0]['id']}",
                    headers=get_supabase_headers(),
                    json={"quantity": new_quantity}
                )
                
                if update_response.status_code in [200, 204]:
                    # Get updated item
                    get_response = await client.get(
                        f"{SUPABASE_URL}/rest/v1/cart_items?id=eq.{existing[0]['id']}",
                        headers=get_supabase_headers()
                    )
                    if get_response.status_code == 200:
                        data = get_response.json()[0]
                        return CartItemResponse(
                            id=data["id"],
                            user_id=data["user_id"],
                            service_id=data["service_id"],
                            quantity=data["quantity"],
                            created_at=data.get("created_at")
                        )
        
        # Add new item
        payload = {
            "user_id": user_id,
            "service_id": item.service_id,
            "quantity": item.quantity
        }
        
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/cart_items",
            headers=get_supabase_headers(),
            json=payload
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            if isinstance(data, list):
                data = data[0]
            return CartItemResponse(
                id=data["id"],
                user_id=data["user_id"],
                service_id=data["service_id"],
                quantity=data["quantity"],
                created_at=data.get("created_at")
            )
        
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.patch("/{item_id}", response_model=CartItemResponse)
async def update_cart_item(item_id: str, update: CartItemUpdate, authorization: str = Header(None)):
    """Update cart item quantity"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    user_id = await get_user_id_from_token(authorization) if authorization else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Please sign in")
    
    if update.quantity <= 0:
        # Remove item if quantity is 0 or negative
        return await remove_from_cart(item_id, authorization)
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/cart_items?id=eq.{item_id}&user_id=eq.{user_id}",
            headers=get_supabase_headers(),
            json={"quantity": update.quantity}
        )
        
        if response.status_code in [200, 204]:
            get_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/cart_items?id=eq.{item_id}",
                headers=get_supabase_headers()
            )
            if get_response.status_code == 200:
                data = get_response.json()
                if data:
                    item = data[0]
                    return CartItemResponse(
                        id=item["id"],
                        user_id=item["user_id"],
                        service_id=item["service_id"],
                        quantity=item["quantity"],
                        created_at=item.get("created_at")
                    )
        
        raise HTTPException(status_code=404, detail="Cart item not found")

@router.delete("/{item_id}")
async def remove_from_cart(item_id: str, authorization: str = Header(None)):
    """Remove item from cart"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    user_id = await get_user_id_from_token(authorization) if authorization else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Please sign in")
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{SUPABASE_URL}/rest/v1/cart_items?id=eq.{item_id}&user_id=eq.{user_id}",
            headers=get_supabase_headers()
        )
        
        if response.status_code in [200, 204]:
            return {"message": "Item removed from cart"}
        
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.delete("")
async def clear_cart(authorization: str = Header(None)):
    """Clear all items from cart"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    user_id = await get_user_id_from_token(authorization) if authorization else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Please sign in")
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{SUPABASE_URL}/rest/v1/cart_items?user_id=eq.{user_id}",
            headers=get_supabase_headers()
        )
        
        if response.status_code in [200, 204]:
            return {"message": "Cart cleared"}
        
        raise HTTPException(status_code=response.status_code, detail=response.text)

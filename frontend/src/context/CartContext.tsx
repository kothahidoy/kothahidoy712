import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "./SessionContext";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

export interface CartItem {
  id: string;
  service_id: string;
  service_title?: string;
  service_image?: string;
  service_price?: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  loading: boolean;
  addToCart: (
    serviceId: string,
    quantity?: number,
    override?: { title?: string; image?: string; price?: number }
  ) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  /** Replace entire local cart (guest-mode). Used by category screens to sync their inline cart UI with the global cart. */
  replaceAllItems: (
    items: { service_id: string; quantity: number; title?: string; image?: string; price?: number }[]
  ) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { session, user } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + (item.service_price || 0) * item.quantity, 0);

  // Get auth headers
  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  }, [session]);

  // Fetch cart from API or local storage
  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      if (session?.access_token) {
        // Fetch from API for logged-in users
        const res = await fetch(`${API_BASE}/api/cart`, {
          headers: getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } else {
        // Use local storage for guests
        const stored = await AsyncStorage.getItem("@mfixit_cart");
        if (stored) {
          setItems(JSON.parse(stored));
        }
      }
    } catch (e) {
      console.error("Error fetching cart:", e);
    } finally {
      setLoading(false);
    }
  }, [session, getHeaders]);

  // Sync local cart to API when user logs in
  useEffect(() => {
    refreshCart();
  }, [session?.access_token]);

  // Save to local storage for guests
  const saveLocalCart = async (newItems: CartItem[]) => {
    await AsyncStorage.setItem("@mfixit_cart", JSON.stringify(newItems));
    setItems(newItems);
  };

  // Add item to cart
  const addToCart = async (
    serviceId: string,
    quantity: number = 1,
    override?: { title?: string; image?: string; price?: number }
  ): Promise<boolean> => {
    try {
      if (session?.access_token && !override) {
        // API call for logged-in users with real DB service
        const res = await fetch(`${API_BASE}/api/cart/add`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ service_id: serviceId, quantity }),
        });
        if (res.ok) {
          await refreshCart();
          return true;
        } else {
          const error = await res.json();
          console.error("Add to cart error:", error);
          return false;
        }
      } else {
        // Local storage path (guests OR override with hardcoded service)
        const existing = items.find((i) => i.service_id === serviceId);
        if (existing) {
          const updated = items.map((i) =>
            i.service_id === serviceId ? { ...i, quantity: i.quantity + quantity } : i
          );
          await saveLocalCart(updated);
        } else {
          let title = override?.title;
          let image = override?.image;
          let price = override?.price;
          // If no override, try fetching service details
          if (!override) {
            try {
              const svcRes = await fetch(`${API_BASE}/api/admin/public/services`);
              const services = svcRes.ok ? await svcRes.json() : [];
              const service = services.find((s: any) => s.id === serviceId);
              title = title || service?.title;
              image = image || service?.image;
              price = price ?? service?.starting_price;
            } catch { /* ignore */ }
          }
          const newItem: CartItem = {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            service_id: serviceId,
            service_title: title || "Service",
            service_image: image || "",
            service_price: price ?? 0,
            quantity,
          };
          await saveLocalCart([...items, newItem]);
        }
        return true;
      }
    } catch (e) {
      console.error("Error adding to cart:", e);
      return false;
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        return removeFromCart(itemId);
      }

      if (session?.access_token) {
        await fetch(`${API_BASE}/api/cart/${itemId}`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ quantity }),
        });
        await refreshCart();
      } else {
        const updated = items.map((i) => (i.id === itemId ? { ...i, quantity } : i));
        await saveLocalCart(updated);
      }
    } catch (e) {
      console.error("Error updating quantity:", e);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    try {
      if (session?.access_token) {
        await fetch(`${API_BASE}/api/cart/${itemId}`, {
          method: "DELETE",
          headers: getHeaders(),
        });
        await refreshCart();
      } else {
        const updated = items.filter((i) => i.id !== itemId);
        await saveLocalCart(updated);
      }
    } catch (e) {
      console.error("Error removing from cart:", e);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      if (session?.access_token) {
        await fetch(`${API_BASE}/api/cart`, {
          method: "DELETE",
          headers: getHeaders(),
        });
        await refreshCart();
      } else {
        await AsyncStorage.removeItem("@mfixit_cart");
        setItems([]);
      }
    } catch (e) {
      console.error("Error clearing cart:", e);
    }
  };

  // Replace all local cart items (used by category screens to sync inline state)
  const replaceAllItems = async (
    incoming: { service_id: string; quantity: number; title?: string; image?: string; price?: number }[]
  ) => {
    try {
      // Build merged item list: keep ANY existing items whose service_id isn't in incoming list
      // (so items from other categories aren't wiped when this category re-syncs).
      // Identify the set of service_ids passed in.
      const incomingIds = new Set(incoming.map((x) => x.service_id));
      const preserved = items.filter((it) => !incomingIds.has(it.service_id));
      const merged: CartItem[] = [
        ...preserved,
        ...incoming
          .filter((x) => x.quantity > 0)
          .map((x) => {
            // Preserve existing CartItem id if same service_id existed before
            const existing = items.find((i) => i.service_id === x.service_id);
            return {
              id: existing?.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${x.service_id}`,
              service_id: x.service_id,
              service_title: x.title || existing?.service_title || "Service",
              service_image: x.image || existing?.service_image || "",
              service_price: x.price ?? existing?.service_price ?? 0,
              quantity: x.quantity,
            } as CartItem;
          }),
      ];
      await saveLocalCart(merged);
    } catch (e) {
      console.error("replaceAllItems error:", e);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        replaceAllItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

export type ID = string;

export interface Category {
  id: ID;
  name: string;
  icon: string; // lucide icon name
  color: string; // tint color background
  description?: string;
  imageUrl?: string; // realistic category image (like Urban Company)
}

// Sub-service within a category (like AC, Washing Machine under "AC & Appliance Repair")
export interface SubService {
  id: ID;
  categoryId: ID;
  name: string;
  imageUrl: string;
  estimatedMins?: number; // "44 mins" badge
  rating?: number;
  bookingCount?: string; // "13.6 M bookings"
  sections?: SubServiceSection[];
}

export interface SubServiceSection {
  title: string; // "Large appliances", "Other appliances"
  items: SubServiceItem[];
}

export interface SubServiceItem {
  id: ID;
  name: string;
  imageUrl: string;
  estimatedMins?: number;
}

export interface Professional {
  id: ID;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  verified: boolean;
  category: ID;
}

export interface Service {
  id: ID;
  categoryId: ID;
  subServiceId?: ID; // links to SubService (e.g., "AC" under "AC & Appliance Repair")
  title: string;
  description: string;
  startingPrice: number;
  originalPrice?: number; // for showing strikethrough price
  durationMins: number;
  rating: number;
  reviewCount: number;
  image: string;
  popular?: boolean;
  topRated?: boolean;
  recommended?: boolean;
  inclusions?: string[];
  sortOrder?: number; // home-screen section ordering
  shortDescription?: string; // 60-80 chars shown under service card
  // Urban Company style fields
  serviceType?: string; // "Service", "Repair & gas refill", "Installation"
  pricePerUnit?: string; // "₹549/AC"
  warrantyDays?: number; // "30 days warranty"
  instantAvailable?: boolean; // shows "Instant" badge
}

export interface SavedAddress {
  id: ID;
  label: string; // Home, Office, ...
  addressLine: string;
  landmark?: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

// Updated to include 'assigned' status for provider workflow
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "on_the_way"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";
export type PaymentMethod = "razorpay" | "cash";

export interface Booking {
  id: ID;
  serviceId: ID;
  serviceTitle: string;
  serviceImage: string;
  professionalName?: string;
  scheduledDate: string; // ISO
  timeSlot: string;
  address: SavedAddress;
  notes?: string;
  price: number;
  status: BookingStatus;
  createdAt: string;
  rating?: number;
  review?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
  paidAt?: string;
  // Provider assignment fields
  providerId?: ID;
  providerName?: string;
}

export interface Offer {
  id: ID;
  title: string;
  subtitle: string;
  code: string;
  discountPercent: number;
  validUntil: string;
  bannerUrl: string;
  bgColor: string;
}

export type UserRole = "customer" | "admin";

export interface UserProfile {
  id: ID;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  city: string;
  createdAt: string;
  role?: UserRole;
}

// Provider types for service technician management
export interface Provider {
  id: ID;
  name: string;
  phone: string;
  serviceType: ID; // maps to category.id
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

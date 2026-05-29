export type ID = string;

export interface Category {
  id: ID;
  name: string;
  icon: string; // lucide icon name
  color: string; // tint color background
  description?: string;
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
  title: string;
  description: string;
  startingPrice: number;
  durationMins: number;
  rating: number;
  reviewCount: number;
  image: string;
  popular?: boolean;
  topRated?: boolean;
  recommended?: boolean;
  inclusions?: string[];
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

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

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

export interface UserProfile {
  id: ID;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  city: string;
  createdAt: string;
}

// Types for service detail screens
export interface ServiceVariant {
  id: string;
  name: string;
  rating: number;
  reviews: string;
  price: number;
  originalPrice?: number;
  duration?: number;
  image: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  avatar: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface ServiceDetailData {
  id: string;
  title: string;
  description?: string;
  rating: number;
  reviewCount: string;
  categoryName: string;
  categoryColor: string;
  categoryBgColor: string;
  heroImage?: string;
  variants: ServiceVariant[];
  process: ProcessStep[];
  inclusions?: string[];
  exclusions?: string[];
  brands?: string[];
  reviews: Review[];
  faqs: FAQ[];
  warranty?: string;
  coverFeatures?: string[];
}

export interface CartItem {
  variantId: string;
  serviceId: string;
  quantity: number;
  price: number;
  name: string;
  image: string;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  image?: string;
  image_url?: string;
  category: 'haircut' | 'beard' | 'combo' | 'coloring' | 'other';
  is_active?: boolean;
}

// Team Member Types
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  description?: string;
  bio?: string;
  image?: string;
  image_url?: string;
  specialties: string[];
  is_active?: boolean;
}

// Booking Types
export interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  service?: Service;
  teamMemberId?: string;
  teamMember?: TeamMember;
  date: string; // ISO date string
  time: string; // HH:mm format
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

export interface BookingFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  teamMemberId?: string;
  date: Date | null;
  time: string;
  notes: string;
}

// Time Slot Types
export interface TimeSlot {
  time: string;
  available: boolean;
}

// Review Types
export interface Review {
  id: string;
  customer_name: string;
  customerName?: string; // dla kompatybilności
  avatar?: string;
  rating: number;
  comment: string;
  date?: string; // dla kompatybilności
  created_at?: string;
  is_approved?: boolean;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatContext {
  faceShape?: string;
  hairType?: string;
  preferences?: string[];
  lastRecommendation?: string;
}

// Face Shape Types for RAG
export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'long' | 'diamond';

export interface HairstyleRecommendation {
  faceShape: FaceShape;
  hairstyles: string[];
  description: string;
  services: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Calendar Types
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isAvailable: boolean;
  hasBookings: boolean;
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

// Feature Types
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Contact Types
export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  hours: {
    day: string;
    hours: string;
  }[];
  social: {
    facebook?: string;
    instagram?: string;
  };
}

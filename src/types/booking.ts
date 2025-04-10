export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Booking {
  id: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  customerInfo: CustomerInfo;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface BookingContextType {
  serviceType: string | null;
  setServiceType: (type: string | null) => void;
  date: string | null;
  setDate: (date: string | null) => void;
  timeSlot: string | null;
  setTimeSlot: (time: string | null) => void;
  customerInfo: CustomerInfo | null;
  setCustomerInfo: (info: CustomerInfo | null) => void;
  submitBooking: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  resetBooking: () => void;
} 
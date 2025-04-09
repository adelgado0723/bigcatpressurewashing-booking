export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          created_at: string
          customer_email: string
          customer_phone: string | null
          customer_name: string | null
          address: string
          city: string
          state: string
          zip: string
          total_amount: number
          deposit_amount: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_payment_status: string
          payment_method: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          customer_email: string
          customer_phone?: string | null
          customer_name?: string | null
          address: string
          city: string
          state: string
          zip: string
          total_amount: number
          deposit_amount: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string
          payment_method?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          customer_email?: string
          customer_phone?: string | null
          customer_name?: string | null
          address?: string
          city?: string
          state?: string
          zip?: string
          total_amount?: number
          deposit_amount?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string
          payment_method?: Json | null
        }
      }
      booking_services: {
        Row: {
          id: string
          booking_id: string
          service_type: string
          material: string | null
          size: number
          stories: number | null
          roof_pitch: string | null
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          service_type: string
          material?: string | null
          size: number
          stories?: number | null
          roof_pitch?: string | null
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          service_type?: string
          material?: string | null
          size?: number
          stories?: number | null
          roof_pitch?: string | null
          price?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
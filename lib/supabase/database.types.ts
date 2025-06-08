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
      users: {
        Row: {
          id: string
          member_id: number
          name: string
          phone: string
          email: string | null
          image_url: string | null
          status: boolean
          created_at: string
          address: string | null
          gender: string | null
        }
        Insert: {
          id?: string
          member_id?: number
          name: string
          phone: string
          email?: string | null
          image_url?: string | null
          status?: boolean
          created_at?: string
          address?: string | null
          gender?: string | null
        }
        Update: {
          id?: string
          member_id?: number
          name?: string
          phone?: string
          email?: string | null
          image_url?: string | null
          status?: boolean
          created_at?: string
          address?: string | null
          gender?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          payment_date: string
          expiration_date: string
          created_at: string
          total_days: number
          active_days: number
          inactive_days: number
          inactive_start_date: string | null
          days_remaining: number | null
        }
        Insert: {
          id?: string
          user_id: string
          payment_date: string
          expiration_date: string
          created_at?: string
          total_days: number
          active_days?: number
          inactive_days?: number
          inactive_start_date?: string | null
          days_remaining?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          payment_date?: string
          expiration_date?: string
          created_at?: string
          total_days?: number
          active_days?: number
          inactive_days?: number
          inactive_start_date?: string | null
          days_remaining?: number | null
        }
      }
    }
  }
}
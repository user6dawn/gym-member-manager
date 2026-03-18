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
          remarks: string | null
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
          remarks?: string | null
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
          remarks?: string | null
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
          session: string | null
        }
        Insert: {
          id?: string
          user_id: string
          payment_date: string
          expiration_date: string
          created_at?: string
          total_days: number
          session?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          payment_date?: string
          expiration_date?: string
          created_at?: string
          total_days?: number
          session?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          role: string
        }
        Insert: {
          id: string
          role: string
        }
        Update: {
          id?: string
          role?: string
        }
      }
    }
  }
}

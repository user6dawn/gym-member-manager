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
          name: string
          phone: string
          email: string | null
          image_url: string | null
          status: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          image_url?: string | null
          status?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          image_url?: string | null
          status?: boolean
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          payment_date: string
          expiration_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_date: string
          expiration_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_date?: string
          expiration_date?: string
          created_at?: string
        }
      }
    }
  }
}
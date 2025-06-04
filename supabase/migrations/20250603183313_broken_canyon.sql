/*
  # Create initial schema for gym member tracking app

  1. New Tables
    - `users`: Stores gym member information
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone` (text)
      - `email` (text, nullable)
      - `image_url` (text, nullable)
      - `status` (boolean)
      - `created_at` (timestamp)
    
    - `subscriptions`: Stores subscription information for gym members
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users.id)
      - `payment_date` (date)
      - `expiration_date` (date)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to perform CRUD operations
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  image_url TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (admin)
-- Users table policies
CREATE POLICY "Allow full access to authenticated users"
  ON users
  FOR ALL
  TO authenticated
  USING (true);

-- Allow anonymous users to insert new members through the public form
CREATE POLICY "Allow public to insert users"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Subscriptions table policies
CREATE POLICY "Allow full access to authenticated users for subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiration_date ON subscriptions(expiration_date);
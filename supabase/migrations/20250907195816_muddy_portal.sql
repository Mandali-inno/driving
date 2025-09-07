/*
  # Fix RLS policies for user profile creation

  1. Policy Changes
    - Drop existing restrictive policies
    - Add INSERT policy for authenticated users to create their own profile
    - Add SELECT policy for authenticated users to read their own profile
    - Add UPDATE policy for authenticated users to update their own profile

  2. Security
    - Maintains data isolation (users can only access their own data)
    - Allows profile creation during sign-up process
    - Uses auth.uid() for proper user identification
*/

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies that allow proper user profile management
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
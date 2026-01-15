/*
  # Add Public Read Access to Questions Table

  1. Changes
    - Add SELECT policy for anonymous users on `questions` table
    - Allows the app to fetch questions for gameplay
    - Read-only: NO INSERT, UPDATE, or DELETE permissions

  2. Security
    - Only SELECT is allowed
    - No modification permissions for anonymous users
    - Existing admin policies remain unchanged
*/

-- Allow anonymous users to read questions for gameplay
CREATE POLICY "Public can read questions"
  ON public.questions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Profile table for the demo single-user marketplace app.
-- Stores editable profile info plus settings/preferences in dedicated columns.
-- Since the app has no auth, RLS is open to anon for SELECT and UPDATE on this table.

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Antonio Mbá',
  location text NOT NULL DEFAULT 'Malabo, Guinea Ecuatorial',
  bio text NOT NULL DEFAULT 'Vendedor verificado · Miembro desde 2022 · Responde en menos de 1h',
  avatar_url text NOT NULL DEFAULT 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
  cover_url text NOT NULL DEFAULT 'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1200',
  email text NOT NULL DEFAULT 'antonio.mba@example.com',
  phone text NOT NULL DEFAULT '+240 222 000 000',
  language text NOT NULL DEFAULT 'es',
  notif_messages boolean NOT NULL DEFAULT true,
  notif_offers boolean NOT NULL DEFAULT true,
  notif_marketing boolean NOT NULL DEFAULT false,
  show_email boolean NOT NULL DEFAULT false,
  show_phone boolean NOT NULL DEFAULT true,
  dark_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Demo policies (no auth in app yet) -------------------------------------------
CREATE POLICY "anon_read_profiles" ON profiles
  FOR SELECT TO anon USING (true);

CREATE POLICY "auth_read_profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "anon_update_profiles" ON profiles
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "auth_update_profiles" ON profiles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Seed demo profile ------------------------------------------------------------
INSERT INTO profiles (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

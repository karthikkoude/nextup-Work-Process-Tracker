-- ============================================================
-- NestUp Work Process Tracker -- Seed Data
-- Section 09: Demo data for dependency chain verification
-- All passwords: Demo1234!
-- ============================================================

-- ============================================================
-- 1. CREATE AUTH USERS
-- Direct INSERT into auth.users (requires service_role key)
-- ============================================================

-- admin1: admin@nestup.com
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  'a1111111-1111-1111-1111-111111111001',
  '00000000-0000-0000-0000-000000000000',
  'admin@nestup.com',
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin One"}',
  now(), now(),
  '', '', '', ''
);

-- admin2: sarah@nestup.com
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  'a1111111-1111-1111-1111-111111111002',
  '00000000-0000-0000-0000-000000000000',
  'sarah@nestup.com',
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Sarah Admin"}',
  now(), now(),
  '', '', '', ''
);

-- member1: alex@nestup.com
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  'a1111111-1111-1111-1111-111111111003',
  '00000000-0000-0000-0000-000000000000',
  'alex@nestup.com',
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Alex Member"}',
  now(), now(),
  '', '', '', ''
);

-- member2: priya@nestup.com
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  'a1111111-1111-1111-1111-111111111004',
  '00000000-0000-0000-0000-000000000000',
  'priya@nestup.com',
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Priya Member"}',
  now(), now(),
  '', '', '', ''
);

-- member3: carlos@nestup.com
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  'a1111111-1111-1111-1111-111111111005',
  '00000000-0000-0000-0000-000000000000',
  'carlos@nestup.com',
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Carlos Member"}',
  now(), now(),
  '', '', '', ''
);

-- member4: nina@nestup.com
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  'a1111111-1111-1111-1111-111111111006',
  '00000000-0000-0000-0000-000000000000',
  'nina@nestup.com',
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Nina Member"}',
  now(), now(),
  '', '', '', ''
);

-- ============================================================
-- 1.4 NORMALIZE AUTH AUDIENCE/ROLE
-- ============================================================

UPDATE auth.users
SET
  aud = COALESCE(aud, 'authenticated'),
  role = COALESCE(role, 'authenticated')
WHERE id IN (
  'a1111111-1111-1111-1111-111111111001',
  'a1111111-1111-1111-1111-111111111002',
  'a1111111-1111-1111-1111-111111111003',
  'a1111111-1111-1111-1111-111111111004',
  'a1111111-1111-1111-1111-111111111005',
  'a1111111-1111-1111-1111-111111111006'
);

-- ============================================================
-- 1.5 CREATE AUTH IDENTITIES (required for password sign-in)
-- NOTE: inserting only into auth.users is not enough for GoTrue login
-- ============================================================

INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
SELECT
  u.id::text,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', (u.email_confirmed_at IS NOT NULL)
  ),
  'email',
  now(),
  now()
FROM auth.users u
WHERE u.id IN (
  'a1111111-1111-1111-1111-111111111001',
  'a1111111-1111-1111-1111-111111111002',
  'a1111111-1111-1111-1111-111111111003',
  'a1111111-1111-1111-1111-111111111004',
  'a1111111-1111-1111-1111-111111111005',
  'a1111111-1111-1111-1111-111111111006'
)
ON CONFLICT (provider_id, provider) DO NOTHING;

-- ============================================================
-- 2. CREATE PUBLIC USER PROFILES
-- ============================================================

INSERT INTO public.users (id, name, email, role, skills) VALUES
  ('a1111111-1111-1111-1111-111111111001', 'Admin One',    'admin@nestup.com',  'admin',  ARRAY['Management','Planning']),
  ('a1111111-1111-1111-1111-111111111002', 'Sarah Admin',  'sarah@nestup.com',  'admin',  ARRAY['Design','Management']),
  ('a1111111-1111-1111-1111-111111111003', 'Alex Member',  'alex@nestup.com',   'member', ARRAY['React','TypeScript','Node.js']),
  ('a1111111-1111-1111-1111-111111111004', 'Priya Member', 'priya@nestup.com',  'member', ARRAY['Python','Data','ML']),
  ('a1111111-1111-1111-1111-111111111005', 'Carlos Member','carlos@nestup.com', 'member', ARRAY['Node.js','PostgreSQL','DevOps']),
  ('a1111111-1111-1111-1111-111111111006', 'Nina Member',  'nina@nestup.com',   'member', ARRAY['React','CSS','Figma']);

-- ============================================================
-- 3. CREATE WORK ITEMS
-- ============================================================

INSERT INTO public.work_items (id, title, description, priority, progress, status, assigned_to, required_skills, progress_history) VALUES
  -- Item A: UI Design Mockups -- nina -- progress=60 (seed value for demo)
  ('b2222222-2222-2222-2222-222222222001', 'UI Design Mockups',
   'Create high-fidelity UI mockups for the main application screens',
   'high', 60, 'in-progress',
   'a1111111-1111-1111-1111-111111111006',
   ARRAY['React','CSS','Figma'],
   '[{"progress": 0, "timestamp": "2026-03-30T10:00:00Z"}, {"progress": 30, "timestamp": "2026-03-31T10:00:00Z"}, {"progress": 60, "timestamp": "2026-04-01T10:00:00Z"}]'::jsonb),

  -- Item B: Frontend Development -- alex -- progress=0
  -- Will be unblocked at runtime because A=60 >= threshold 50
  ('b2222222-2222-2222-2222-222222222002', 'Frontend Development',
   'Implement the frontend React components based on approved mockups',
   'high', 0, 'in-progress',
   'a1111111-1111-1111-1111-111111111003',
   ARRAY['React','TypeScript','Node.js'],
   '[]'::jsonb),

  -- Item C: API Integration -- carlos -- progress=0
  -- Blocked because B=0 < threshold 100
  ('b2222222-2222-2222-2222-222222222003', 'API Integration',
   'Build and integrate REST API endpoints for all core features',
   'critical', 0, 'blocked',
   'a1111111-1111-1111-1111-111111111005',
   ARRAY['Node.js','PostgreSQL','DevOps'],
   '[]'::jsonb),

  -- Item D: Data Pipeline Setup -- priya -- progress=30
  -- No dependencies -- isolated item
  ('b2222222-2222-2222-2222-222222222004', 'Data Pipeline Setup',
   'Design and implement the data processing pipeline',
   'medium', 30, 'in-progress',
   'a1111111-1111-1111-1111-111111111004',
   ARRAY['Python','Data','ML'],
   '[{"progress": 0, "timestamp": "2026-03-31T10:00:00Z"}, {"progress": 30, "timestamp": "2026-04-01T10:00:00Z"}]'::jsonb),

  -- Item E: QA Testing -- alex -- progress=0
  -- Blocked because C=0 < threshold 100
  ('b2222222-2222-2222-2222-222222222005', 'QA Testing',
   'Comprehensive quality assurance testing across all modules',
   'high', 0, 'blocked',
   'a1111111-1111-1111-1111-111111111003',
   ARRAY['React','TypeScript','Node.js'],
   '[]'::jsonb),

  -- Item F: Performance Optimization -- carlos -- progress=0
  -- Blocked because C=0 < threshold 100
  ('b2222222-2222-2222-2222-222222222006', 'Performance Optimization',
   'Profile and optimize application performance bottlenecks',
   'medium', 0, 'blocked',
   'a1111111-1111-1111-1111-111111111005',
   ARRAY['Node.js','PostgreSQL','DevOps'],
   '[]'::jsonb),

  -- Item G: Deployment Prep -- carlos -- progress=0
  -- Zero dependencies -- used for circular rejection demo (try G → A)
  ('b2222222-2222-2222-2222-222222222007', 'Deployment Prep',
   'Prepare CI/CD pipelines and production deployment configuration',
   'low', 0, 'in-progress',
   'a1111111-1111-1111-1111-111111111005',
   ARRAY['Node.js','PostgreSQL','DevOps'],
   '[]'::jsonb);

-- ============================================================
-- 4. CREATE DEPENDENCIES
-- ============================================================

INSERT INTO public.dependencies (from_id, to_id, type, threshold) VALUES
  -- A → B : partial, threshold=50
  -- B unblocks when A >= 50%. A=60% so B is in-progress at load.
  ('b2222222-2222-2222-2222-222222222001', 'b2222222-2222-2222-2222-222222222002', 'partial', 50),

  -- B → C : full, threshold=100
  -- C only unblocks when B=100%
  ('b2222222-2222-2222-2222-222222222002', 'b2222222-2222-2222-2222-222222222003', 'full',    100),

  -- C → E : full, threshold=100
  -- E only unblocks when C=100%
  ('b2222222-2222-2222-2222-222222222003', 'b2222222-2222-2222-2222-222222222005', 'full',    100),

  -- C → F : full, threshold=100
  -- F only unblocks when C=100% -- makes C a bottleneck (blocks E+F)
  ('b2222222-2222-2222-2222-222222222003', 'b2222222-2222-2222-2222-222222222006', 'full',    100);

-- ============================================================
-- VERIFICATION ON LOAD
-- ============================================================
-- Item A: no predecessors → in-progress ✓
-- Item B: A(60) >= 50 → NOT blocked → in-progress ✓
-- Item C: B(0) < 100 → BLOCKED ✓
-- Item D: no dependencies → in-progress ✓
-- Item E: C(0) < 100 → BLOCKED ✓
-- Item F: C(0) < 100 → BLOCKED ✓
-- Item G: no dependencies → in-progress ✓
--
-- Bottleneck: C blocks E and F (2 successors, status != 'done') ✓
-- Circular demo: G has zero deps -- try adding G → A to test hasCycle() ✓

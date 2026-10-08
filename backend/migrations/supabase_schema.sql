-- ============================================================================
-- CAMPUS AI — SUPABASE POSTGRESQL COMPLETE ENTERPRISE SCHEMA MIGRATION
-- "Understand. Predict. Solve. Improve."
-- ============================================================================

-- 0. Enable Essential PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USER PROFILE ARCHITECTURE & RBAC
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  head_of_department TEXT,
  building TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'teacher', 'admin')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  department_name TEXT,
  designation TEXT,
  profile_photo_url TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  course TEXT,
  year INTEGER DEFAULT 1,
  semester INTEGER DEFAULT 1,
  section TEXT DEFAULT 'A',
  cgpa NUMERIC(3,2) DEFAULT 8.0,
  attendance_rate NUMERIC(5,2) DEFAULT 85.0,
  risk_level TEXT DEFAULT 'Low' CHECK (risk_level IN ('Low', 'Moderate', 'High', 'Critical')),
  status TEXT DEFAULT 'Active',
  enrollment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faculty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  department TEXT,
  designation TEXT DEFAULT 'Assistant Professor',
  qualification TEXT,
  specialization TEXT,
  phone TEXT,
  cabin_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ACADEMIC CORE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT UNIQUE NOT NULL,
  building TEXT NOT NULL,
  capacity INTEGER DEFAULT 60,
  type TEXT DEFAULT 'Classroom',
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  credits INTEGER DEFAULT 3,
  semester INTEGER DEFAULT 1,
  syllabus JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  semester INTEGER DEFAULT 1,
  section TEXT DEFAULT 'A',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  semester INTEGER,
  academic_year TEXT DEFAULT '2025-2026',
  status TEXT DEFAULT 'Enrolled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, academic_year)
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
  remarks TEXT,
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  marks_obtained NUMERIC(5,2) NOT NULL,
  max_marks NUMERIC(5,2) DEFAULT 100,
  grade TEXT,
  semester INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ NOT NULL,
  max_score INTEGER DEFAULT 100,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  grade NUMERIC(5,2),
  feedback TEXT,
  status TEXT DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Graded', 'Late', 'Resubmitted')),
  UNIQUE(assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS learning_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topics JSONB DEFAULT '[]'::jsonb,
  target_date DATE,
  progress NUMERIC(5,2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  resource_type TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  file_url TEXT,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  duration_minutes INTEGER DEFAULT 30,
  total_questions INTEGER DEFAULT 10,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  answers JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CAMPUS PROBLEM & RESOLUTION INTELLIGENCE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS campus_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  building TEXT NOT NULL,
  floor TEXT,
  zone TEXT,
  coordinates JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  sla_hours INTEGER DEFAULT 48,
  default_priority TEXT DEFAULT 'Medium',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  location TEXT,
  issue_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Open',
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES issue_categories(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'AI Triaged', 'Assigned', 'In Progress', 'Resolved', 'Verified', 'Closed', 'Reopened')),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  location_id UUID REFERENCES campus_locations(id) ON DELETE SET NULL,
  location TEXT,
  cluster_id UUID REFERENCES issue_clusters(id) ON DELETE SET NULL,
  sla_deadline TIMESTAMPTZ,
  is_escalated BOOLEAN DEFAULT FALSE,
  sentiment_score NUMERIC(3,2),
  ai_tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID UNIQUE REFERENCES issues(id) ON DELETE CASCADE,
  sla_hours INTEGER NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  is_breached BOOLEAN DEFAULT FALSE,
  breached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  escalated_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  escalated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID UNIQUE REFERENCES issues(id) ON DELETE CASCADE,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_summary TEXT NOT NULL,
  proof_photos JSONB DEFAULT '[]'::jsonb,
  resolved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resolution_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID UNIQUE REFERENCES issues(id) ON DELETE CASCADE,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_satisfied BOOLEAN NOT NULL,
  verification_notes TEXT,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  category TEXT DEFAULT 'general',
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  analysis_type TEXT NOT NULL,
  result JSONB NOT NULL,
  confidence NUMERIC(3,2),
  model_version TEXT DEFAULT 'gemini-1.5-flash',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. SMART RESOURCE OPTIMIZATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('classroom', 'lab', 'seminar_hall', 'projector', 'computer', 'library_space', 'faculty_resource', 'staff', 'equipment')),
  building TEXT,
  room_number TEXT,
  capacity INTEGER DEFAULT 30,
  current_utilization NUMERIC(5,2) DEFAULT 0,
  peak_utilization NUMERIC(5,2) DEFAULT 0,
  power_consumption_kw NUMERIC(5,2) DEFAULT 0,
  maintenance_status TEXT DEFAULT 'Good' CHECK (maintenance_status IN ('Good', 'Requires Inspection', 'Under Maintenance', 'Decommissioned')),
  is_available BOOLEAN DEFAULT TRUE,
  meta_specs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  booked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  purpose TEXT NOT NULL,
  department TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  attendees INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Confirmed' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled', 'Reallocated')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  occupancy_rate NUMERIC(5,2) DEFAULT 0,
  power_draw_kw NUMERIC(5,2) DEFAULT 0,
  temperature_c NUMERIC(4,1) DEFAULT 24.0,
  is_anomalous BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS resource_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  issue_description TEXT NOT NULL,
  severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  scheduled_date DATE,
  technician_name TEXT,
  cost NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation_type TEXT NOT NULL,
  projected_energy_savings_pct NUMERIC(5,2) DEFAULT 0,
  projected_utilization_boost_pct NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Implemented')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  previous_resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES resource_bookings(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  impact_summary TEXT,
  allocated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  scenario_params JSONB NOT NULL,
  outcome_metrics JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  changes JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. AI CODE LAB TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS code_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Algorithm',
  language TEXT NOT NULL DEFAULT 'javascript',
  source_code TEXT NOT NULL DEFAULT '',
  stdin TEXT DEFAULT '',
  last_output TEXT DEFAULT '',
  last_error TEXT DEFAULT '',
  execution_status TEXT DEFAULT 'idle' CHECK (execution_status IN ('idle', 'running', 'success', 'error', 'timeout')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES code_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  execution_time NUMERIC(8,3) DEFAULT 0,
  exit_code INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'timeout', 'runtime_error')),
  stdout TEXT DEFAULT '',
  stderr TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES code_sessions(id) ON DELETE CASCADE,
  input TEXT DEFAULT '',
  expected_output TEXT DEFAULT '',
  actual_output TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES code_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('explain', 'optimize', 'debug', 'complexity', 'test_generation')),
  prompt_context TEXT,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  language TEXT DEFAULT 'python',
  difficulty TEXT DEFAULT 'intermediate',
  generated_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_profile ON students(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject ON marks(subject_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_assigned ON issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issues_created ON issues(created_at);
CREATE INDEX IF NOT EXISTS idx_issue_assignments_issue ON issue_assignments(issue_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_res ON resource_bookings(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_time ON resource_bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_code_sessions_user ON code_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_executions_session ON code_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user role from auth token or profile
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Users see own profile, faculty/admins see all
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    auth.uid() = auth_user_id OR 
    get_current_user_role() IN ('admin', 'faculty', 'teacher')
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    auth.uid() = auth_user_id OR 
    get_current_user_role() = 'admin'
  );

-- Code Sessions: Users only access their own coding sessions
DROP POLICY IF EXISTS "code_sessions_policy" ON code_sessions;
CREATE POLICY "code_sessions_policy" ON code_sessions
  FOR ALL USING (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
    get_current_user_role() = 'admin'
  );

-- Code Executions: Scoped to user's sessions
DROP POLICY IF EXISTS "code_executions_policy" ON code_executions;
CREATE POLICY "code_executions_policy" ON code_executions
  FOR ALL USING (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
    get_current_user_role() = 'admin'
  );

-- Issues: Anyone authenticated can view; reporters can create; assigned/admins can update
DROP POLICY IF EXISTS "issues_select_policy" ON issues;
CREATE POLICY "issues_select_policy" ON issues
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "issues_insert_policy" ON issues;
CREATE POLICY "issues_insert_policy" ON issues
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

-- Notifications: Only receiver can read/update
DROP POLICY IF EXISTS "notifications_policy" ON notifications;
CREATE POLICY "notifications_policy" ON notifications
  FOR ALL USING (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- 8. POSTGRESQL RPC FUNCTIONS FOR ATOMIC OPERATIONS
-- ============================================================================

-- Function: Approve Resource Reallocation atomically
CREATE OR REPLACE FUNCTION approve_resource_allocation(
  p_booking_id UUID,
  p_new_resource_id UUID,
  p_approved_by UUID,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_old_resource_id UUID;
  v_result JSONB;
BEGIN
  -- Get current resource
  SELECT resource_id INTO v_old_resource_id
  FROM resource_bookings WHERE id = p_booking_id;

  IF v_old_resource_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  -- Update booking
  UPDATE resource_bookings
  SET resource_id = p_new_resource_id,
      status = 'Reallocated'
  WHERE id = p_booking_id;

  -- Create allocation audit log
  INSERT INTO resource_allocations (
    resource_id,
    previous_resource_id,
    booking_id,
    approved_by,
    reason,
    impact_summary
  ) VALUES (
    p_new_resource_id,
    v_old_resource_id,
    p_booking_id,
    p_approved_by,
    p_reason,
    'Reallocated via CampusAI Autonomous Optimization Engine'
  );

  v_result := jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'old_resource_id', v_old_resource_id,
    'new_resource_id', p_new_resource_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate Resource Utilization summary
CREATE OR REPLACE FUNCTION calculate_resource_utilization()
RETURNS TABLE (
  total_resources BIGINT,
  avg_utilization NUMERIC,
  high_load_count BIGINT,
  underutilized_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_resources,
    ROUND(AVG(current_utilization), 2) AS avg_utilization,
    COUNT(*) FILTER (WHERE current_utilization >= 80)::BIGINT AS high_load_count,
    COUNT(*) FILTER (WHERE current_utilization < 35)::BIGINT AS underutilized_count
  FROM resources
  WHERE is_available = TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Record Code Execution Log atomically
CREATE OR REPLACE FUNCTION record_code_execution(
  p_session_id UUID,
  p_user_id UUID,
  p_language TEXT,
  p_time NUMERIC,
  p_exit_code INTEGER,
  p_status TEXT,
  p_stdout TEXT,
  p_stderr TEXT
)
RETURNS UUID AS $$
DECLARE
  v_exec_id UUID;
BEGIN
  INSERT INTO code_executions (
    session_id, user_id, language, execution_time, exit_code, status, stdout, stderr
  ) VALUES (
    p_session_id, p_user_id, p_language, p_time, p_exit_code, p_status, p_stdout, p_stderr
  ) RETURNING id INTO v_exec_id;

  UPDATE code_sessions
  SET last_output = p_stdout,
      last_error = p_stderr,
      execution_status = p_status,
      updated_at = NOW()
  WHERE id = p_session_id;

  RETURN v_exec_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

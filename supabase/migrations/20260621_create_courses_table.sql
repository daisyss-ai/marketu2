CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_years INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'course_id'
  ) THEN
    ALTER TABLE classes ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
  END IF;
END $$;

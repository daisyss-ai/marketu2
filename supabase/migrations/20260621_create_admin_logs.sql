-- Admin audit log: every privileged action must be recorded before completing.

CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN admin_logs.action IS
  'Action type: promote_admin | demote_admin | ban_user | unban_user | verify_seller | approve_product | reject_product | remove_product | create_institution | edit_institution | create_course | create_class | create_academic_year | edit_student_data | approve_enrollment | reject_enrollment | export_csv';

COMMENT ON COLUMN admin_logs.target_type IS
  'Target entity: user | product | institution | course | class | academic_year | student | enrollment | export';

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read admin logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
        AND users.status = 'active'
    )
  );

-- Inserts are performed server-side via service role (see lib/admin/logAction.ts).

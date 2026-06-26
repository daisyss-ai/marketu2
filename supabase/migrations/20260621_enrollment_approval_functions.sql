-- Transactional functions for student enrollment approval/rejection

CREATE OR REPLACE FUNCTION approve_enrollment_transaction(
  p_verification_id UUID,
  p_user_id UUID,
  p_admin_id UUID
) RETURNS VOID AS $$
BEGIN
  -- 1. Update verification
  UPDATE enrollment_verifications
  SET status = 'active',
      reviewed_by = p_admin_id,
      reviewed_at = now()
  WHERE id = p_verification_id;

  -- 2. Update user
  UPDATE users
  SET status = 'active',
      is_verified = true
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_enrollment_transaction(
  p_verification_id UUID,
  p_user_id UUID,
  p_admin_id UUID,
  p_rejection_note TEXT
) RETURNS VOID AS $$
BEGIN
  -- 1. Update verification
  UPDATE enrollment_verifications
  SET status = 'suspended',
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      rejection_note = p_rejection_note
  WHERE id = p_verification_id;

  -- 2. Update user
  UPDATE users
  SET status = 'suspended'
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

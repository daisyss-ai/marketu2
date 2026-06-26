/** Values documented on admin_logs.action */
export const ADMIN_LOG_ACTIONS = [
  "promote_admin",
  "demote_admin",
  "ban_user",
  "unban_user",
  "verify_seller",
  "approve_product",
  "reject_product",
  "remove_product",
  "create_institution",
  "edit_institution",
  "create_course",
  "create_class",
  "create_academic_year",
  "edit_student_data",
  "approve_enrollment",
  "reject_enrollment",
  "export_csv",
  "create_category",
  "edit_category",
  "archive_category",
] as const;

export type AdminLogAction = (typeof ADMIN_LOG_ACTIONS)[number];

/** Values documented on admin_logs.target_type */
export const ADMIN_LOG_TARGET_TYPES = [
  "user",
  "product",
  "institution",
  "course",
  "class",
  "academic_year",
  "student",
  "enrollment",
  "export",
  "category",
] as const;

export type AdminLogTargetType = (typeof ADMIN_LOG_TARGET_TYPES)[number];

export type LogAdminActionParams = {
  adminId: string;
  action: AdminLogAction;
  targetType: AdminLogTargetType;
  targetId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

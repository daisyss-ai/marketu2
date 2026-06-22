import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/supabase";

import type { LogAdminActionParams } from "./types";

export type { AdminLogAction, AdminLogTargetType, LogAdminActionParams } from "./types";
export { ADMIN_LOG_ACTIONS, ADMIN_LOG_TARGET_TYPES } from "./types";

type AdminSupabaseClient = SupabaseClient<Database>;

function toJsonMetadata(metadata: Record<string, unknown> | undefined): Json | null {
  if (metadata === undefined) return null;
  return metadata as Json;
}

/** Core insert — exported for unit tests with a mock client. */
export async function insertAdminLog(
  supabase: AdminSupabaseClient,
  { adminId, action, targetType, targetId, reason, metadata }: LogAdminActionParams,
): Promise<void> {
  const { error } = await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    reason: reason ?? null,
    metadata: toJsonMetadata(metadata),
  });

  if (error) {
    throw new Error(`Failed to log admin action: ${error.message}`);
  }
}

export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  await insertAdminLog(createAdminClient(), params);
}

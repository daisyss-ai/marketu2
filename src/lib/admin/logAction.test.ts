import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";

import { insertAdminLog, logAdminAction } from "./logAction";

describe("insertAdminLog", () => {
  it("inserts a row with the expected payload", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn().mockReturnValue({ insert }) };

    await insertAdminLog(supabase as never, {
      adminId: "admin-1",
      action: "ban_user",
      targetType: "user",
      targetId: "user-9",
      reason: "Terms violation",
      metadata: { source: "admin_panel" },
    });

    expect(supabase.from).toHaveBeenCalledWith("admin_logs");
    expect(insert).toHaveBeenCalledWith({
      admin_id: "admin-1",
      action: "ban_user",
      target_type: "user",
      target_id: "user-9",
      reason: "Terms violation",
      metadata: { source: "admin_panel" },
    });
  });

  it("throws when the insert fails so the caller action can abort", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: "connection failed" } }),
      }),
    };

    await expect(
      insertAdminLog(supabase as never, {
        adminId: "admin-1",
        action: "approve_product",
        targetType: "product",
        targetId: "product-1",
      }),
    ).rejects.toThrow("Failed to log admin action: connection failed");
  });
});

describe("logAdminAction", () => {
  it("delegates to the admin service client", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ insert }),
    } as never);

    await logAdminAction({
      adminId: "admin-1",
      action: "export_csv",
      targetType: "export",
      targetId: "00000000-0000-0000-0000-000000000001",
    });

    expect(createAdminClient).toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-1",
        action: "export_csv",
        target_type: "export",
      }),
    );
  });
});

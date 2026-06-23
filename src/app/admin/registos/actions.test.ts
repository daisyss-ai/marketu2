import { describe, expect, it, vi, beforeEach } from "vitest";

// Mocks
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/admin/logAction", () => ({
  logAdminAction: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/logAction";
import { revalidatePath } from "next/cache";
import { getPendingEnrollments, processEnrollmentAction } from "./actions";

describe("Registos Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPendingEnrollments", () => {
    it("fails if not authenticated", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await getPendingEnrollments();
      expect(result.success).toBe(false);
      expect(result.error).toContain("Não autenticado");
    });

    it("fails if authenticated but not admin", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: "student" }, error: null }),
            }),
          }),
        }),
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await getPendingEnrollments();
      expect(result.success).toBe(false);
      expect(result.error).toContain("Acesso negado");
    });

    it("succeeds and queries with correct filters if admin", async () => {
      const mockQueryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [{ id: "verif-1" }], error: null }),
      };
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null }),
        },
        from: vi.fn().mockImplementation((table) => {
          if (table === "users") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
                }),
              }),
            };
          }
          if (table === "enrollment_verifications") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(mockQueryChain),
              }),
            };
          }
        }),
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await getPendingEnrollments("inst-1");
      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: "verif-1" }]);
      expect(mockQueryChain.eq).toHaveBeenCalledWith("users.institution_id", "inst-1");
    });
  });

  describe("processEnrollmentAction", () => {
    it("fails if rejecting without note", async () => {
      const result = await processEnrollmentAction({ id: "v-1", status: "suspended" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("motivo de rejeição é obrigatório");
    });

    it("approves and updates both tables successfully", async () => {
      // Auth Client Mocks
      const mockAuthSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
            }),
          }),
        }),
      };
      vi.mocked(createClient).mockResolvedValue(mockAuthSupabase as any);

      // Admin Client Mocks
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockAdminSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === "enrollment_verifications") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { status: "pending", user_id: "student-id" },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            };
          }
          if (table === "users") {
            return {
              update: updateMock,
            };
          }
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

      const result = await processEnrollmentAction({ id: "v-1", status: "active" });
      expect(result.success).toBe(true);
      expect(mockAdminSupabase.from).toHaveBeenCalledWith("enrollment_verifications");
      expect(mockAdminSupabase.from).toHaveBeenCalledWith("users");
      expect(logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: "admin-id",
          action: "approve_enrollment",
          targetType: "enrollment",
          targetId: "v-1",
        }),
      );
      expect(revalidatePath).toHaveBeenCalledWith("/admin/registos");
    });

    it("rolls back verification status if user update fails", async () => {
      const mockAuthSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
            }),
          }),
        }),
      };
      vi.mocked(createClient).mockResolvedValue(mockAuthSupabase as any);

      const verifEq = vi.fn().mockResolvedValue({ error: null });
      const userEq = vi.fn().mockResolvedValue({ error: { message: "db constraint error" } });

      const mockAdminSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === "enrollment_verifications") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { status: "pending", user_id: "student-id" },
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({ eq: verifEq }),
            };
          }
          if (table === "users") {
            return {
              update: vi.fn().mockReturnValue({ eq: userEq }),
            };
          }
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

      const result = await processEnrollmentAction({ id: "v-1", status: "active" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("db constraint error");
      // First call = initial update, second call = rollback to pending
      expect(verifEq).toHaveBeenCalledTimes(2);
      expect(verifEq).toHaveBeenNthCalledWith(2, "id", "v-1");
    });
  });
});

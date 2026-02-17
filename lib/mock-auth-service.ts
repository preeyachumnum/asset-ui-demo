/**
 * Mock Auth Service
 * เลียนแบบ response จาก asset-api auth endpoints ทุกประการ
 * Accept ทุก email/password เพื่อให้ demo ได้ทันที
 */

import type { LoginBeginResponse, LoginResponse, PlantAccess } from "@/lib/types";
import { uid } from "@/lib/mock-utils";

/* ---------- mock data ---------- */

const MOCK_PLANTS: PlantAccess[] = [
  { PlantId: "a1b2c3d4-1111-4000-8000-000000000001", PlantCode: "KLS", PlantName: "โรงงานน้ำตาล กาฬสินธุ์" },
  { PlantId: "a1b2c3d4-2222-4000-8000-000000000002", PlantCode: "SBR", PlantName: "โรงงานน้ำตาล สิงห์บุรี" },
  { PlantId: "a1b2c3d4-3333-4000-8000-000000000003", PlantCode: "ATG", PlantName: "โรงงานเอทานอล อ่างทอง" },
  { PlantId: "a1b2c3d4-4444-4000-8000-000000000004", PlantCode: "HQ", PlantName: "สำนักงานใหญ่" },
];

/* ---------- helper ---------- */

/** จำลอง delay เล็กน้อยเหมือน network latency */
function fakeDelay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deriveDisplayName(email: string): string {
  const local = email.split("@")[0] || "demo";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/* ---------- public ---------- */

/**
 * เลียนแบบ POST /auth/begin
 * API จริง return: { user: { UserId, Email, DisplayName, IsActive } | null, plants: PlantAccess[] }
 */
export async function mockAuthBegin(email: string): Promise<LoginBeginResponse> {
  await fakeDelay(200);

  const trimmed = (email || "").trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    return { ok: true, user: null, plants: [] };
  }

  return {
    ok: true,
    user: {
      UserId: uid(),
      Email: trimmed,
      DisplayName: deriveDisplayName(trimmed),
      IsActive: true,
    },
    plants: [...MOCK_PLANTS],
  };
}

/**
 * เลียนแบบ POST /auth/login
 * API จริง return: { sessionId (GUID), expiresAt (DateTime), user: { userId, email, displayName } }
 */
export async function mockAuthLogin(
  email: string,
  _password: string,
  _plantId?: string,
): Promise<LoginResponse> {
  await fakeDelay(400);

  const trimmed = (email || "").trim().toLowerCase();
  if (!trimmed) {
    throw new Error("กรุณากรอกอีเมล");
  }

  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 ชม.

  return {
    ok: true,
    sessionId: uid(),
    expiresAt,
    user: {
      userId: uid(),
      email: trimmed,
      displayName: deriveDisplayName(trimmed),
    },
  };
}

/**
 * เลียนแบบ POST /auth/logout
 * API จริง return: { ok: true, data: ... }
 */
export async function mockAuthLogout(_sessionId?: string): Promise<{ ok: boolean }> {
  await fakeDelay(150);
  return { ok: true };
}

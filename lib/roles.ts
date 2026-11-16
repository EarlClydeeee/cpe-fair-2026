import type { Enums } from "./supabase/database.types";

export type AdminRole = Enums<"admin_role">;

export function roleLabel(role: AdminRole) {
  const map: Record<AdminRole, string> = {
    owner: "Workspace owner",
    site_admin: "Site admin",
    scoring_admin: "Scoring admin",
    events_editor: "Events editor",
  };
  return map[role];
}

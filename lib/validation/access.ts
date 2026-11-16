import { z } from "zod";
import { uuidSchema } from "./common";

export const adminRoleSchema = z.enum([
  "owner",
  "site_admin",
  "scoring_admin",
  "events_editor",
]);

export const inviteAdminSchema = z.object({
  email: z.email({ error: "Enter a valid email." }).trim().toLowerCase(),
  role: adminRoleSchema,
});

export const updateRoleSchema = z.object({
  profile_id: uuidSchema,
  role: adminRoleSchema,
});

export const revokeInviteSchema = z.object({
  id: uuidSchema,
});

export const scoreDraftSchema = z.object({
  team_id: uuidSchema,
  category_id: uuidSchema,
  draft_points: z.coerce.number().int().min(0).max(100000),
  reason: z.string().trim().max(500).default(""),
});

export const discardDraftSchema = z.object({
  draft_id: uuidSchema,
});

export const publishDraftsSchema = z.object({
  draft_ids: z
    .string()
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(uuidSchema).min(1)),
});

export const eventSchema = z.object({
  id: uuidSchema.optional(),
  title: z.string().trim().min(2).max(160),
  category_id: uuidSchema,
  team_a_id: z
    .union([z.literal(""), uuidSchema])
    .optional()
    .transform((v) => (v ? v : null)),
  team_b_id: z
    .union([z.literal(""), uuidSchema])
    .optional()
    .transform((v) => (v ? v : null)),
  day_number: z.coerce.number().int().min(1).max(30),
  starts_at: z.string().min(1),
  venue: z.string().trim().max(160).default(""),
  status: z.enum(["upcoming", "in_progress", "final", "archived"]),
  notes: z.string().trim().max(1000).default(""),
});

export const teamSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Use lowercase-hyphen slugs." }),
  affiliation: z.string().trim().max(80).default(""),
  color_hex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, { error: "Use a #RRGGBB color." }),
  artwork_url: z
    .union([
      z.literal(""),
      z.url({ error: "Enter a valid artwork URL." }),
    ])
    .optional()
    .transform((v) => (v ? v : null)),
  visibility: z.enum(["active", "archived"]),
  sort_order: z.coerce.number().int().default(0),
});

export const deleteByIdSchema = z.object({
  id: uuidSchema,
});

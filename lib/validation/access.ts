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

export const CLEAR_SEASON_PHRASE_1 = "DELETE THIS SEASON";
export const CLEAR_SEASON_PHRASE_2 = "BYE DATA FOR CPE FAIR 2026";

export const clearSeasonContentSchema = z.object({
  confirm_phrase_1: z.literal(CLEAR_SEASON_PHRASE_1, {
    error: `Type ${CLEAR_SEASON_PHRASE_1} exactly.`,
  }),
  confirm_phrase_2: z.literal(CLEAR_SEASON_PHRASE_2, {
    error: `Type ${CLEAR_SEASON_PHRASE_2} exactly.`,
  }),
});

export const scoreDraftSchema = z.object({
  team_id: uuidSchema,
  competition_id: uuidSchema,
  draft_points: z.coerce.number().int().min(0).max(100000),
  reason: z.string().trim().max(500).default(""),
});

export const categorySchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Use lowercase-hyphen slugs." }),
  sort_order: z.coerce.number().int().default(0),
});

export const competitionSchema = z.object({
  id: uuidSchema.optional(),
  category_id: uuidSchema,
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Use lowercase-hyphen slugs." }),
  sort_order: z.coerce.number().int().default(0),
});

export const archiveByIdSchema = z.object({
  id: uuidSchema,
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

const optionalUuid = z
  .union([z.literal(""), uuidSchema])
  .optional()
  .transform((v) => (v ? v : null));

const clockHour = z.coerce.number().int().min(1).max(12);
const clockMinute = z
  .string()
  .regex(/^\d{1,2}$/)
  .transform((v) => v.padStart(2, "0"))
  .refine((v) => Number(v) >= 0 && Number(v) <= 59, { message: "Invalid minute." });
const clockPeriod = z.enum(["AM", "PM"]);

export const eventSchema = z
  .object({
    id: uuidSchema.optional(),
    name: z.string().trim().min(2).max(160),
    category_id: uuidSchema,
    competition_id: uuidSchema,
    match_type: z.enum(["head_to_head", "all_teams"]),
    team_a_id: optionalUuid,
    team_b_id: optionalUuid,
    event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Pick a date." }),
    start_hour: clockHour,
    start_minute: clockMinute,
    start_period: clockPeriod,
    end_hour: clockHour,
    end_minute: clockMinute,
    end_period: clockPeriod,
    venue: z.string().trim().max(160).default(""),
    match_format: z.string().trim().max(160).default(""),
    is_highlighted: z
      .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
      .optional()
      .transform((v) => v === "on" || v === "true"),
    // Legacy "auto" still accepted from older rows; UI no longer offers it.
    status_override: z.enum(["auto", "upcoming", "ongoing", "ended"]),
    winner_team_id: optionalUuid,
    result_note: z.string().trim().max(500).default(""),
  })
  .superRefine((data, ctx) => {
    if (data.match_type === "head_to_head") {
      if (!data.team_a_id) {
        ctx.addIssue({ code: "custom", message: "Select Team A.", path: ["team_a_id"] });
      }
      if (!data.team_b_id) {
        ctx.addIssue({ code: "custom", message: "Select Team B.", path: ["team_b_id"] });
      }
      if (data.team_a_id && data.team_b_id && data.team_a_id === data.team_b_id) {
        ctx.addIssue({
          code: "custom",
          message: "Team A and Team B must differ.",
          path: ["team_b_id"],
        });
      }
      if (
        data.winner_team_id &&
        data.team_a_id &&
        data.team_b_id &&
        data.winner_team_id !== data.team_a_id &&
        data.winner_team_id !== data.team_b_id
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Winner must be Team A or Team B.",
          path: ["winner_team_id"],
        });
      }
    }
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

export const assignWinnerSchema = z.object({
  id: uuidSchema,
  winner_team_id: uuidSchema,
  /** Preview Final step may force Final so a winner can be saved. */
  force_final: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

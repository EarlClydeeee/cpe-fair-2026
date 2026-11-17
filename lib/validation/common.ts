import { z } from "zod";

/** Postgres uuid text shape (not RFC-variant-strict; seed/demo ids use repeated hex). */
export const uuidSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    { error: "Invalid id." },
  );

export const optionalUrl = z
  .union([z.literal(""), z.url({ error: "Enter a valid URL." })])
  .optional()
  .transform((v) => (v ? v : null));

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

export const boolFromForm = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

export const slugSchema = z
  .string()
  .trim()
  .min(2, { error: "Slug is required." })
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    error: "Use lowercase letters, numbers and hyphens.",
  });

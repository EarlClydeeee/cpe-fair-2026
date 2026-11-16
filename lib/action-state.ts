import type { z } from "zod";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export const initialActionState: ActionState = {};

export function fieldErrors(error: z.ZodError): ActionState {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (errors[key] ??= []).push(issue.message);
  }
  return { ok: false, message: "Please fix the highlighted fields.", errors };
}

export function formObject(formData: FormData) {
  const entries: Record<string, FormDataEntryValue> = {};
  formData.forEach((value, key) => {
    if (!key.startsWith("$ACTION")) entries[key] = value;
  });
  return entries;
}

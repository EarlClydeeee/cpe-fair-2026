import { z } from "zod";

export const signInSchema = z.object({
  email: z.email({ error: "Enter a valid email." }).trim(),
  password: z.string().min(1, { error: "Enter your password." }),
  next: z.string().optional(),
  remember: z.string().optional(),
});

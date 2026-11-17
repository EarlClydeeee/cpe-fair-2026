import { z } from "zod";

export const signInSchema = z.object({
  password: z.string().min(1, { error: "Enter your access code." }),
  next: z.string().optional(),
});

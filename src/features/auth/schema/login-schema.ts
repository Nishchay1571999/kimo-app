import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(320, "Email must be at most 320 characters")
    .email("Enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(7, "Password must be at least 7 characters")
    .max(128, "Password must be at most 128 characters"),
});

export type LoginForm = z.infer<typeof loginSchema>;

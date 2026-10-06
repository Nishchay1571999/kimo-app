import { z } from "zod";

import { loginSchema } from "./login-schema";

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  email: z.string().trim().pipe(loginSchema.shape.email),
  password: loginSchema.shape.password,
  confirmPassword: z.string().min(1, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterForm = z.infer<typeof registerSchema>;

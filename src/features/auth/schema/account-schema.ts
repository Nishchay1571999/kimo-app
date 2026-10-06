import { z } from 'zod';

export const accountSchema = z.object({
  id: z.uuid(), name: z.string().nullable(), email: z.string().nullable(),
  accountStatus: z.enum(['guest', 'member']), timezone: z.string(),
  onboardingCompleted: z.boolean(),
});
export const sessionSchema = accountSchema.extend({ token: z.string().min(1), tokenType: z.literal('Bearer') });
export type Account = z.infer<typeof accountSchema>;
export type Session = z.infer<typeof sessionSchema>;

import { z } from 'zod';

export const lifestyleSchema = z.object({
  healthyEating: z.enum(['not-so-much', 'most-of-the-time', 'every-time'], {
    error: 'Choose how regularly you eat healthy',
  }),
  exerciseFrequency: z.enum(['never', 'once-or-twice', 'four-to-five-plus'], {
    error: 'Choose how regularly you exercise',
  }),
});

export type LifestyleForm = z.infer<typeof lifestyleSchema>;

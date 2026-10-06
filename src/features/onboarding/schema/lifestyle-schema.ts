import { z } from 'zod';

const lifestyleFields = z.object({
  wakeTime: z.string().trim().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Enter wake time in 24-hour format (HH:mm)'),
  sleepTime: z.string().trim().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Enter sleep time in 24-hour format (HH:mm)'),
  healthyEating: z.enum(['not-so-much', 'most-of-the-time', 'every-time'], {
    error: 'Choose how regularly you eat healthy',
  }),
  exerciseFrequency: z.enum(['never', 'once-or-twice', 'four-to-five-plus'], {
    error: 'Choose how regularly you exercise',
  }),
});

export const lifestyleDraftSchema = lifestyleFields.partial();
export const lifestyleSchema = lifestyleFields.refine((value) => value.wakeTime !== value.sleepTime, {
  path: ['sleepTime'], message: 'Wake and sleep times must differ',
});

export type LifestyleForm = z.infer<typeof lifestyleSchema>;

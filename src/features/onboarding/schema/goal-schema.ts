import { z } from 'zod';

export const goalSchema = z.object({
  age: z.number().int('Choose a whole-number age').min(18).max(72),
  gender: z.enum(['male', 'female', 'unspecified'], { error: 'Choose a gender or prefer not to say' }),
  feet: z.string().trim().refine(
    (value) => /^[3-8]$/.test(value),
    'Enter your height in feet (3–8)',
  ),
  inches: z.string().trim().transform((value) => value === '' ? '00' : value).refine(
    (value) => /^\d{1,2}$/.test(value) && Number(value) <= 11,
    'Enter inches from 0 to 11, or leave this blank',
  ),
  weight: z.string().trim().refine(
    (value) => /^\d+(\.\d+)?$/.test(value)
      && Number.isFinite(Number(value)) && Number(value) >= 25 && Number(value) <= 350,
    'Enter your current weight from 25 to 350 kg',
  ),
  intention: z.enum(['lose', 'maintain', 'gain'], { error: 'Choose your monthly goal' }),
});

export type GoalForm = z.infer<typeof goalSchema>;

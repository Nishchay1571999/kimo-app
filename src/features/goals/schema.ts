import { z } from 'zod';

export const CALORIE_RANGE = { min: 1000, max: 5000 } as const;
export const PROTEIN_RANGE = { min: 20, max: 300 } as const;
export const goalTargetSchema = z.object({
  caloriesKcal: z.number().int(), proteinG: z.number().int(),
  method: z.enum(['suggested', 'custom']), confirmedAt: z.iso.datetime({ offset: true }),
});
export const goalTargetResponseSchema = z.object({
  target: goalTargetSchema.nullable(),
  suggestion: z.object({ caloriesKcal: z.number().int(), proteinG: z.number().int(), explanation: z.string() }).nullable(),
});
export type GoalTarget = z.infer<typeof goalTargetSchema>;
export type GoalTargetResponse = z.infer<typeof goalTargetResponseSchema>;
export type TargetInput = Pick<GoalTarget, 'caloriesKcal' | 'proteinG' | 'method'>;

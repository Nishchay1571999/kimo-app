import { z } from 'zod';
import { entryAnalysisSchema } from '../../entries/analysis';

export const reportingDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Choose a valid date');
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const attachmentSchema = z.object({
  type: z.enum(['image', 'audio']), mimeType: z.string(), base64: z.string(),
  durationMs: z.number().nonnegative().optional(),
});
const entrySchema = z.object({
  id: z.uuid(), title: z.string(), category: z.enum(['note', 'nutrition', 'exercise']),
  note: z.string().nullable(), occurredAt: z.iso.datetime({ offset: true }),
  entryDate: reportingDateSchema, attachments: z.array(attachmentSchema), ai: entryAnalysisSchema,
}).passthrough();
export const dayStatusSchema = z.enum(['on_track', 'over', 'under', 'not_logged', 'in_progress']);
export const dayGoalSchema = z.object({
  target: z.object({ caloriesKcal: z.number(), proteinG: z.number() }),
  consumed: z.object({ caloriesKcal: z.number(), proteinG: z.number() }),
  remainingKcal: z.number(), remainingProteinG: z.number(), deltaKcal: z.number(), status: dayStatusSchema,
  biggestMeal: z.object({ entryId: z.string(), title: z.string(), mealCategory: z.string(), caloriesKcal: z.number() }).nullable(),
  insight: z.object({ headline: z.string(), nextStep: z.string().nullable() }),
});
export const weekSchema = z.object({
  from: reportingDateSchema, to: reportingDateSchema, hasTarget: z.boolean(),
  days: z.array(z.object({
    date: reportingDateSchema, status: z.union([dayStatusSchema, z.enum(['logged', 'future'])]),
    caloriesKcal: z.number(), deltaKcal: z.number().nullable(),
  })),
});
export type DayGoal = z.infer<typeof dayGoalSchema>;
export type Week = z.infer<typeof weekSchema>;
export const homeSchema = z.object({
  date: reportingDateSchema, timezone: z.string().refine((value) => {
    try { new Intl.DateTimeFormat('en-US', { timeZone: value }); return true; } catch { return false; }
  }),
  day: z.object({ label: z.string(), weekday: z.string(), previous: reportingDateSchema, next: reportingDateSchema, isToday: z.boolean() }),
  schedule: z.object({ wakeTime: timeSchema.nullable(), sleepTime: timeSchema.nullable(), crossesMidnight: z.boolean() }),
  summary: z.object({
    nutrition: z.object({ caloriesConsumedKcal: z.number().nonnegative(), entryCount: z.number().int().nonnegative() }),
    exercise: z.object({ durationMinutes: z.number().nonnegative(), caloriesBurnedKcal: z.number().nonnegative().nullable() }),
  }),
  // Older servers omit the field; treat that the same as "no confirmed target".
  goal: dayGoalSchema.nullable().optional().transform(value => value ?? null),
  timeline: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('boundary'), boundary: z.enum(['wake', 'sleep']), date: reportingDateSchema, time: timeSchema }),
    z.object({ type: z.literal('entry'), date: reportingDateSchema, time: timeSchema, outsideSchedule: z.boolean(), entry: entrySchema }),
  ])),
}).passthrough();
export type Home = z.infer<typeof homeSchema>;

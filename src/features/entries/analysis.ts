import { z } from 'zod';

export const entryAnalysisSchema = z.object({
  status: z.enum(['not_requested', 'pending', 'processing', 'completed', 'failed']),
  synopsis: z.string().nullable(), errorCode: z.string().nullable().optional(),
});
export type EntryAnalysis = z.infer<typeof entryAnalysisSchema>;
export const analysisPending = (ai: EntryAnalysis) => ai.status === 'pending' || ai.status === 'processing';

export function analysisView(ai: EntryAnalysis) {
  switch (ai.status) {
    case 'pending': return { label: 'AI summary queued', text: 'Waiting for analysis.' };
    case 'processing': return { label: 'AI summary in progress', text: 'Analyzing your entry.' };
    case 'failed': return { label: 'AI summary unavailable', text: 'Analysis failed. Your saved facts are still available.' };
    case 'not_requested': return { label: 'AI summary not requested', text: 'No analysis was requested for this entry.' };
    case 'completed': return { label: 'AI summary', text: ai.synopsis?.trim() || 'Analysis finished without a summary.' };
  }
}

// Each visit/foreground activation gets a limited read-only refresh window.
// HTTP failures stop polling; a manual refresh can try another read.
export function analysisPollInterval(pending: boolean, failed: boolean, activeSince: number | null, now = Date.now()): number | false {
  return pending && !failed && activeSince !== null && now - activeSince < 120000 ? 5000 : false;
}

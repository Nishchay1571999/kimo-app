import type { createApiClient } from '../../lib/api/client';
import { ApiError } from '../../lib/api/client';
import { estimateSchema, type EstimateRequest } from './schema';

export function createEstimateService(client: ReturnType<typeof createApiClient>) {
  return {
    /** Previews calories for a note and photo. Nothing is saved. */
    async estimate(body: EstimateRequest, signal?: AbortSignal) {
      // Extraction, two database lookups and matching can take longer than ordinary requests.
      const result = estimateSchema.safeParse(await client.request('/v1/estimates', { method: 'POST', body, signal, timeoutMs: 90000 }));
      if (!result.success || result.data.category !== body.category) throw new ApiError('Kimo returned an unexpected result. Please try again.', 0, 'INVALID_ESTIMATE_RESPONSE');
      return result.data;
    },
  };
}

import type { createApiClient } from '../../../lib/api/client';
import { ApiError } from '../../../lib/api/client';
import { homeSchema, reportingDateSchema } from '../schema/home-schema';

export function createHomeService(client: ReturnType<typeof createApiClient>) {
  return {
    async get(date: string, signal?: AbortSignal) {
      reportingDateSchema.parse(date);
      const result = homeSchema.safeParse(await client.request(`/v1/home?date=${encodeURIComponent(date)}`, { signal }));
      if (!result.success || result.data.date !== date) throw new ApiError('Could not load this day. Please try again.', 0, 'INVALID_HOME_RESPONSE');
      return result.data;
    },
  };
}

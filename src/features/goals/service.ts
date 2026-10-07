import type { createApiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/client';
import { goalTargetResponseSchema, goalTargetSchema, type TargetInput } from './schema';

export function createGoalService(client: ReturnType<typeof createApiClient>) {
  return {
    async get(signal?: AbortSignal) {
      const result = goalTargetResponseSchema.safeParse(await client.request('/v1/goals/target', { signal }));
      if (!result.success) throw new ApiError('Could not load your target. Please try again.', 0, 'INVALID_TARGET_RESPONSE');
      return result.data;
    },
    async confirm(input: TargetInput) {
      const result = goalTargetSchema.safeParse((await client.request('/v1/goals/target', { method: 'PUT', body: input }) as { target?: unknown })?.target);
      if (!result.success) throw new ApiError('Could not save your target. Please try again.', 0, 'INVALID_TARGET_RESPONSE');
      return result.data;
    },
  };
}

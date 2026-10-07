import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/api/client';
import { createEstimateService } from './service';
import { estimateErrorMessage, type EstimateRequest } from './schema';

const service = createEstimateService(api);
export function useEstimate() {
  return useMutation({
    retry: false,
    mutationFn: async (body: EstimateRequest) => {
      try { return await service.estimate(body); }
      catch (error) {
        if (error instanceof ApiError) throw new ApiError(estimateErrorMessage(error.code, error.message), error.status, error.code);
        throw error;
      }
    },
  });
}

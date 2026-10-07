import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSessionStore } from '@/features/auth/store/session-store';
import { createGoalService } from './service';
import type { GoalTargetResponse, TargetInput } from './schema';

const service = createGoalService(api);
const goalKey = (epoch: number, id: string) => ['account', epoch, 'goal', id] as const;
export function useGoalTarget() {
  const { account, epoch } = useSessionStore(state => state);
  return useQuery({
    queryKey: goalKey(epoch, account?.id ?? ''), queryFn: ({ signal }) => service.get(signal),
    enabled: !!account?.onboardingCompleted, staleTime: 60000, retry: false,
  });
}
export function useConfirmTarget() {
  const client = useQueryClient();
  const { account, epoch } = useSessionStore(state => state);
  return useMutation({
    mutationFn: (input: TargetInput) => service.confirm(input), retry: false,
    onSuccess: async target => {
      const key = goalKey(epoch, account?.id ?? '');
      client.setQueryData<GoalTargetResponse>(key, current => ({ suggestion: current?.suggestion ?? null, target }));
      // Home's goal card and week statuses depend on the target.
      await client.invalidateQueries({ predicate: query => query.queryKey[0] === 'account' && query.queryKey[1] === epoch && query.queryKey[2] === 'home' });
    },
  });
}

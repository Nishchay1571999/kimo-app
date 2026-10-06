import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSessionStore } from '@/features/auth/store/session-store';
import { getEntryIdentity } from '@/features/entries/hooks';
import { createNutritionService } from './service';
import { foodDetailOptions, foodSearchOptions } from './queries';
import type { CalculationInput, FoodSearchInput, FoodSelection } from './schema';
export const nutritionService = createNutritionService(api, getEntryIdentity);
export function useFoodSearch(input: FoodSearchInput | null) {
  const { account, epoch } = useSessionStore(s => s);
  return useQuery({ ...foodSearchOptions(nutritionService, { id: account?.id ?? '', epoch }, input ?? { provider: 'usda-fdc', q: '', page: 1 }), enabled: !!account?.onboardingCompleted && !!input });
}
export function useFoodDetail(input: FoodSelection | null) {
  const { account, epoch } = useSessionStore(s => s);
  return useQuery({ ...foodDetailOptions(nutritionService, { id: account?.id ?? '', epoch }, input ?? { provider: 'usda-fdc', providerFoodId: '' }), enabled: !!account?.onboardingCompleted && !!input });
}
export function useCalculateFood() {
  return useMutation({ mutationFn: async (input: CalculationInput) => {
    const owner = getEntryIdentity(); if (!owner) throw new Error('Please sign in to continue.');
    const item = await nutritionService.calculate(input, owner); return { item, owner };
  }, retry: false });
}

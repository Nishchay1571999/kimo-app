import { queryOptions } from '@tanstack/react-query';
import type { EntryIdentity } from '../entries/services/entry-service';
import type { createNutritionService } from './service';
import type { FoodSearchInput, FoodSelection } from './schema';
type Scope = Pick<EntryIdentity, 'id' | 'epoch'>;
export const searchKey = (owner: Scope, input: FoodSearchInput) => ['account', owner.epoch, 'nutrition-search', owner.id, input.provider, input.q.trim(), input.page] as const;
export const foodKey = (owner: Scope, input: FoodSelection) => ['account', owner.epoch, 'nutrition-food', owner.id, input.provider, input.providerFoodId] as const;
export function foodSearchOptions(service: ReturnType<typeof createNutritionService>, owner: Scope, input: FoodSearchInput) {
  return queryOptions({ queryKey: searchKey(owner, input), queryFn: ({ signal }) => service.search(input, owner, signal), staleTime: 300000, gcTime: 600000, retry: false });
}
export function foodDetailOptions(service: ReturnType<typeof createNutritionService>, owner: Scope, input: FoodSelection) {
  return queryOptions({ queryKey: foodKey(owner, input), queryFn: ({ signal }) => service.food(input, owner, signal), staleTime: 300000, gcTime: 600000, retry: false });
}

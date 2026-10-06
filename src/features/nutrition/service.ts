import { ApiError, type createApiClient } from '../../lib/api/client';
import type { EntryIdentity } from '../entries/services/entry-service';
import { calculationInputSchema, calculatedFoodSchema, foodSchema, foodSelectionSchema, searchInputSchema, searchResultSchema, type CalculationInput, type FoodSearchInput, type FoodSelection } from './schema';

type Scope = Pick<EntryIdentity, 'id' | 'epoch'>;
export function createNutritionService(client: ReturnType<typeof createApiClient>, getIdentity: () => EntryIdentity | null) {
  const isCurrent = (expected: EntryIdentity) => { const owner = getIdentity(); return !!owner && owner.id === expected.id && owner.epoch === expected.epoch && owner.token === expected.token; };
  const identity = (scope: Scope) => {
    const owner = getIdentity();
    if (!owner) throw new ApiError('Please sign in to continue.', 401, 'SESSION_REQUIRED');
    if (owner.id !== scope.id || owner.epoch !== scope.epoch) throw new ApiError('Your session changed. Search again from your current account.', 0, 'SESSION_CHANGED');
    return owner;
  };
  const check = (owner: EntryIdentity) => { if (!isCurrent(owner)) throw new ApiError('Your session changed. Search again from your current account.', 0, 'SESSION_CHANGED'); };
  const invalid = () => new ApiError('Could not read the nutrition reference. Try again or enter confirmed nutrition manually.', 0, 'INVALID_NUTRITION_RESPONSE');
  return {
    isCurrent,
    async search(raw: FoodSearchInput, scope: Scope, signal?: AbortSignal) {
      const input = searchInputSchema.parse(raw); const owner = identity(scope);
      const query = `q=${encodeURIComponent(input.q)}&page=${input.page}&provider=${encodeURIComponent(input.provider)}`;
      const result = await client.request(`/v1/nutrition/search?${query}`, { signal, identity: owner }); check(owner);
      const parsed = searchResultSchema.safeParse(result);
      if (!parsed.success || parsed.data.page !== input.page || parsed.data.foods.some(food => food.provider !== input.provider) || new Set(parsed.data.foods.map(food => food.providerFoodId)).size !== parsed.data.foods.length) throw invalid();
      return parsed.data;
    },
    async food(raw: FoodSelection, scope: Scope, signal?: AbortSignal) {
      const input = foodSelectionSchema.parse(raw); const owner = identity(scope);
      const result = await client.request(`/v1/nutrition/foods/${encodeURIComponent(input.providerFoodId)}?provider=${encodeURIComponent(input.provider)}`, { signal, identity: owner }); check(owner);
      const parsed = foodSchema.safeParse(result);
      if (!parsed.success || parsed.data.provider !== input.provider || parsed.data.providerFoodId !== input.providerFoodId) throw invalid();
      return parsed.data;
    },
    async calculate(raw: CalculationInput, expected: EntryIdentity) {
      const input = calculationInputSchema.parse(raw); identity(expected); check(expected);
      const result = await client.request('/v1/nutrition/calculate', { method: 'POST', body: input, identity: expected }); check(expected);
      const parsed = calculatedFoodSchema.safeParse(result);
      const baseUnit = ['g', 'kg', 'oz'].includes(input.unit) ? 'g' : 'ml';
      if (!parsed.success || parsed.data.quantity !== input.quantity || parsed.data.unit !== input.unit || parsed.data.reference?.provider !== input.provider || parsed.data.reference.providerFoodId !== input.providerFoodId || parsed.data.reference.unit !== baseUnit) throw invalid();
      return parsed.data;
    },
  };
}

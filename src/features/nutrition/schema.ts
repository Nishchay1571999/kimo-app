import { z } from 'zod';
import { foodItemSchema } from '../entries/schema';

export const providerSchema = z.enum(['usda-fdc', 'open-food-facts']);
export type NutritionProvider = z.infer<typeof providerSchema>;
export const providerLabel = (provider: string) => provider === 'usda-fdc' ? 'USDA' : provider === 'open-food-facts' ? 'Open Food Facts' : provider;
export function validFoodId(provider: NutritionProvider, id: string) { return (provider === 'usda-fdc' ? /^[1-9]\d{0,9}$/ : /^\d{4,24}$/).test(id); }
const macro = z.number().nonnegative().nullable();
export const foodSchema = z.object({
  id: z.string().min(1), provider: providerSchema, providerFoodId: z.string().min(1), name: z.string().min(1),
  reference: z.object({ quantity: z.number().positive(), unit: z.enum(['g', 'ml']) }),
  nutrition: z.object({ caloriesKcal: macro, proteinG: macro, carbohydratesG: macro, fatG: macro }),
}).refine(food => validFoodId(food.provider, food.providerFoodId), 'Invalid food identifier');
export type Food = z.infer<typeof foodSchema>;
export const searchInputSchema = z.object({ q: z.string().trim().min(1, 'Enter a food name').max(200, 'Use at most 200 characters'), provider: providerSchema, page: z.number().int().min(1).max(1000) });
export type FoodSearchInput = z.infer<typeof searchInputSchema>;
export const searchResultSchema = z.object({ foods: z.array(foodSchema), page: z.number().int().positive(), totalPages: z.number().int().nonnegative(), totalHits: z.number().int().nonnegative() });
export const foodSelectionSchema = z.object({ provider: providerSchema, providerFoodId: z.string() }).refine(value => validFoodId(value.provider, value.providerFoodId), 'Invalid food identifier');
export type FoodSelection = z.infer<typeof foodSelectionSchema>;
export const portionSchema = z.object({ quantity: z.string().trim().regex(/^\d+(?:\.\d+)?$/, 'Enter a positive quantity').refine(value => Number.isFinite(Number(value)) && Number(value) > 0, 'Enter a positive quantity'), unit: z.enum(['g', 'kg', 'oz', 'ml', 'l']) });
export type PortionValues = z.infer<typeof portionSchema>;
export const calculationInputSchema = foodSelectionSchema.and(z.object({ quantity: z.number().positive(), unit: portionSchema.shape.unit }));
export type CalculationInput = z.infer<typeof calculationInputSchema>;
export const calculatedFoodSchema = foodItemSchema.refine(item => item.quantitySource === 'user_entered' && item.nutritionSource === 'reference' && !!item.reference, 'Missing nutrition reference');
export const unitsFor = (unit: 'g' | 'ml'): PortionValues['unit'][] => unit === 'g' ? ['g', 'kg', 'oz'] : ['ml', 'l'];

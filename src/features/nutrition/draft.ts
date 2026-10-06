import type { FoodItem } from '../entries/schema';
import type { EntryFormValues } from '../upload/schema';
const numeric = (value: number | null) => value === null ? '' : String(value);
export function foodToForm(item: FoodItem): EntryFormValues['items'][number] {
  return { id: item.id, name: item.name, quantity: String(item.quantity), unit: item.unit, caloriesKcal: String(item.caloriesKcal), proteinG: numeric(item.proteinG), carbohydratesG: numeric(item.carbohydratesG), fatG: numeric(item.fatG) };
}
export function addCalculatedFood(values: EntryFormValues, item: FoodItem, targetId?: string): { values: EntryFormValues; item: FoodItem } {
  if (values.category !== 'nutrition') throw new Error('Add this food to a meal draft.');
  const items = [...values.items];
  const index = targetId ? items.findIndex(food => food.id === targetId) : -1;
  if (targetId && index < 0) throw new Error('This food was removed. Select it again.');
  const next = targetId ? { ...item, id: targetId } : item;
  const form = foodToForm(next);
  if (targetId) items[index] = form;
  else if (items.length === 1 && ['name', 'quantity', 'unit', 'caloriesKcal', 'proteinG', 'carbohydratesG', 'fatG'].every(key => !String(items[0][key as keyof typeof form] ?? '').trim())) items[0] = form;
  else {
    if (items.length >= 100) throw new Error('A meal can contain up to 100 foods.');
    if (items.some(food => food.id === next.id)) throw new Error('This calculated food is already in your draft.');
    items.push(form);
  }
  return { values: { ...values, items }, item: next };
}

import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Button, ButtonText } from '@/components/ui/Button';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { entryService, useSaveEntry } from '@/features/entries/hooks';
import { ApiError } from '@/lib/api/client';
import { draftFacts } from '@/features/entries/draft';
import { providerLabel } from '@/features/nutrition/schema';
import { entryFormSchema } from '@/features/upload/schema';
import { uploadStore } from '@/features/upload/store/upload-store';
import { Action, closeTo, draftRoute, StorageNotice, styles, UploadPage, useDraft } from '@/features/upload/components/shared';

export default function ReviewScreen() {
  const nav = useDemoNavigation();
  const { draft, savingId } = useDraft();
  const save = useSaveEntry();
  const focused = useRef(false);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; }; }, []));
  const busy = save.isPending || !!savingId;
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  if (!draft && save.isPending) return <UploadPage title="Saving your entry" subtitle="Updating your day with the saved entry." onClose={() => closeTo(nav.backToOrigin)}><ActivityIndicator accessibilityLabel="Saving entry" /></UploadPage>;
  if (!draft) return <UploadPage title="No draft to review" subtitle="Start an entry to add your details and photos." onClose={() => closeTo(nav.backToOrigin)}>
    <Action onPress={() => router.replace(nav.withOrigin('/capture'))}>Add an entry</Action>
  </UploadPage>;
  const parsed = entryFormSchema.safeParse(draft.values);
  const facts = parsed.success ? draftFacts(draft) : null;
  const v = draft.values;
  return <UploadPage title="Review your entry" subtitle="Check the details and photos. You can go back to correct anything." onClose={() => closeTo(nav.backToOrigin)}>
    <StorageNotice />
    <View style={styles.card}>
      <Text style={styles.section}>{v.title.trim() || 'Untitled draft'}</Text>
      <Text style={styles.text}>Reporting date: {v.entryDate}</Text>
      <Text style={styles.muted}>Occurred at: {v.occurredAt}</Text>
      {v.category === 'nutrition' && <>
        <Text style={styles.text}>Meal: {v.mealCategory}</Text>
        {v.items.map((food, i) => <View key={i} style={{ gap: 4 }}>
          <Text style={styles.text}>{food.name || `Food ${i + 1}`} · {food.quantity} {food.unit}</Text>
          <Text style={styles.muted}>{food.caloriesKcal || 'Unknown'} kcal · Protein: {food.proteinG || 'unknown'} g · Carbs: {food.carbohydratesG || 'unknown'} g · Fat: {food.fatG || 'unknown'} g</Text>
          {facts && 'items' in facts.data && facts.data.items && <Text style={styles.muted}>Nutrition source: {facts.data.items[i].nutritionSource === 'reference' && 'reference' in facts.data.items[i] ? providerLabel(String(facts.data.items[i].reference?.provider)) : facts.data.items[i].nutritionSource === 'estimated' ? 'Estimated' : 'Entered manually'}</Text>}
        </View>)}
        {parsed.success && <Text style={styles.section}>{v.items.reduce((total, food) => total + Number(food.caloriesKcal), 0)} kcal total</Text>}
      </>}
      {v.category === 'exercise' && <>
        <Text style={styles.text}>{v.activityName} · {v.durationMinutes} minutes · {v.intensity}</Text>
        <Text style={styles.muted}>{v.estimatedCaloriesBurnedKcal.trim() ? `${v.estimatedCaloriesBurnedKcal} kcal estimated · ${v.calorieEstimationSource}` : 'Calories burned: unknown'}</Text>
      </>}
      {!!v.note.trim() && <Text style={styles.text}>{v.note}</Text>}
    </View>
    {draft.photos.length > 0 && <View style={styles.card}><Text style={styles.section}>Attachments</Text>
      {draft.photos.map((photo, i) => <View key={photo.id} style={{ gap: 8 }}>
        <View>{photo.type === 'image' ? <Image source={{ uri: `data:${photo.mimeType};base64,${photo.base64}` }} style={{ width: '100%', aspectRatio: (photo.widthPx ?? 4) / (photo.heightPx ?? 3), borderRadius: 10 }} contentFit="contain" accessibilityLabel={`Attached photo ${i + 1}`} /> : <Text style={styles.text}>Audio attachment{photo.durationMs ? ` · ${Math.round(photo.durationMs / 1000)} seconds` : ''}</Text>}</View>
        <Button variant="ghost" disabled={busy || !!draft.savedEntryId} accessibilityLabel={`Remove attachment ${i + 1}`} onPress={() => uploadStore.getState().removePhoto(draft.id, photo.id)}><ButtonText>Remove attachment</ButtonText></Button>
      </View>)}
    </View>}
    {!parsed.success && <Text accessibilityRole="alert" style={styles.error}>Some details still need attention. Edit the draft before saving.</Text>}
    {save.error && <Text accessibilityRole="alert" style={styles.error}>{save.error.message}</Text>}
    {save.error instanceof ApiError && save.error.status === 409 && draft.edit && <Action secondary onPress={() => router.push({ pathname: '/entries/[entryId]', params: { entryId: draft.edit!.entryId, date: draft.edit!.originalDate, origin: draft.origin } })}>View latest entry</Action>}
    {draft.savedEntryId ? <Text style={styles.text}>Your entry was saved. The local draft still needs to be cleared; retry cleanup without saving again.</Text> : <Action secondary disabled={busy} onPress={() => router.replace(draftRoute(draft))}>Edit details</Action>}
    <Button size="lg" loading={busy} disabled={!parsed.success} onPress={() => save.mutate(draft.id, { onSuccess: result => {
      if (!focused.current || !entryService.isCurrent(result.owner) || !result.cleaned) return;
      const currentDraft = uploadStore.getState().draft;
      if (currentDraft && currentDraft.id !== draft.id) return;
      router.replace({ pathname: '/entries/[entryId]', params: { entryId: result.entry.id, date: result.entry.entryDate, origin: draft.origin } });
    } })} style={styles.primary}><ButtonText>{draft.savedEntryId ? 'Finish local cleanup' : draft.edit ? 'Save changes' : 'Save entry'}</ButtonText></Button>
    <Action onPress={() => closeTo(nav.backToOrigin)}>Keep draft and close</Action>
    {confirmDiscard ? <View style={styles.card}>
      <Text style={styles.error}>Discard this draft and its photos? This cannot be undone.</Text>
      <Action secondary disabled={busy} onPress={() => { if (uploadStore.getState().discard(draft.id)) router.replace(nav.backToOrigin); }}>Discard draft</Action>
      <Action secondary onPress={() => setConfirmDiscard(false)}>Keep draft</Action>
    </View> : <Action secondary disabled={busy} onPress={() => setConfirmDiscard(true)}>Discard draft</Action>}
  </UploadPage>;
}

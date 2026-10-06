import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { randomUUID } from 'expo-crypto';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { useEntry, useDeleteEntry, entryService } from '@/features/entries/hooks';
import { entryToForm } from '@/features/entries/draft';
import { ApiError } from '@/lib/api/client';
import { providerLabel } from '@/features/nutrition/schema';
import { AnalysisSummary } from '@/features/entries/components/analysis-summary';
import { analysisPending } from '@/features/entries/analysis';
import { uploadStore } from '@/features/upload/store/upload-store';
import { Action, closeTo, draftRoute, StorageNotice, styles, UploadPage, useDraft } from '@/features/upload/components/shared';

export default function EntryScreen() {
  const nav = useDemoNavigation();
  const { query, validId } = useEntry(nav.entryId ?? '');
  const deletion = useDeleteEntry();
  const { draft, savingId } = useDraft();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const pendingDelete = useRef(false);
  const focused = useRef(false);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; }; }, []));
  const entry = query.data;
  const busy = deletion.isPending || !!savingId;
  const startEdit = () => {
    if (!entry || busy) return;
    setEditError(null);
    try {
      if (draft) {
        if (draft.edit?.entryId === entry.id && draft.edit.revision === entry.revision) router.push(draftRoute(draft));
        else setEditError(draft.edit?.entryId === entry.id ? 'Your draft uses an older version. Resume it to keep your edits, or start over with this version.' : 'You already have an unfinished draft. Resume or discard it before editing this entry.');
        return;
      }
      const opened = uploadStore.getState().beginEdit(randomUUID(), { entryId: entry.id, revision: entry.revision, originalDate: entry.entryDate,
        originalItems: entry.category === 'nutrition' ? entry.data.items : [] }, entryToForm(entry), entry.attachments, nav.origin);
      const next = uploadStore.getState().draft;
      if (opened && next) router.push(draftRoute(next));
      else setEditError('Could not open an edit draft. Resolve the draft storage error and try again.');
    } catch { setEditError('Could not prepare this entry for editing. Refresh and try again.'); }
  };
  const remove = () => {
    if (!entry || pendingDelete.current) return;
    pendingDelete.current = true;
    deletion.mutate(entry.id, {
      onSuccess: result => { if (focused.current && entryService.isCurrent(result.owner)) router.replace(nav.backToOrigin); },
      onSettled: () => { pendingDelete.current = false; },
    });
  };
  return <UploadPage title={entry?.title ?? 'Entry details'} subtitle="View the facts and attachments saved to your account." onClose={() => closeTo(nav.backToOrigin)}>
    <StorageNotice />
    {!validId ? <Text style={styles.error}>This entry link is invalid.</Text> : query.isPending ? <ActivityIndicator accessibilityLabel="Loading entry" /> : !entry ? <View style={styles.card}>
      <Text accessibilityRole="alert" style={styles.error}>{query.error instanceof ApiError && query.error.status === 404 ? 'This entry was deleted or is not available to your account.' : query.error?.message ?? 'Could not load the entry.'}</Text>
      <Action secondary onPress={() => { void query.refetch(); }}>Try again</Action>
    </View> : <>
      {query.isError && <Text style={styles.error}>Could not refresh this entry. Showing the last loaded version.</Text>}
      <View style={styles.card}>
        <Text style={styles.text}>Reporting date: {entry.entryDate}</Text>
        <Text style={styles.muted}>Occurred at: {new Date(entry.occurredAt).toLocaleString(undefined, { timeZone: entry.recordedTimezone })} · {entry.recordedTimezone}</Text>
        {entry.category === 'nutrition' && <>
          <Text style={styles.section}>{entry.data.mealCategory} · {entry.summary.caloriesKcal} kcal</Text>
          {entry.data.items.map(food => <View key={food.id} style={{ gap: 4 }}><Text style={styles.text}>{food.name} · {food.quantity} {food.unit}</Text>
            <Text style={styles.muted}>{food.caloriesKcal} kcal · Protein {food.proteinG ?? 'unknown'} g · Carbs {food.carbohydratesG ?? 'unknown'} g · Fat {food.fatG ?? 'unknown'} g</Text>
            <Text style={styles.muted}>Nutrition source: {food.nutritionSource === 'reference' && food.reference ? providerLabel(food.reference.provider) : food.nutritionSource === 'estimated' ? 'Estimated' : 'Entered manually'}</Text></View>)}
        </>}
        {entry.category === 'exercise' && <><Text style={styles.section}>{entry.data.activityName}</Text><Text style={styles.text}>{entry.data.durationMinutes} minutes · {entry.data.intensity}</Text><Text style={styles.muted}>{entry.data.estimatedCaloriesBurnedKcal === null ? 'Calories burned: unknown' : `${entry.data.estimatedCaloriesBurnedKcal} kcal estimated · ${entry.data.calorieEstimationSource}`}</Text></>}
        {!!entry.note && <Text style={styles.text}>{entry.note}</Text>}
      </View>
      <View style={styles.card}>
        <AnalysisSummary ai={entry.ai} />
        {analysisPending(entry.ai) && <Text style={styles.muted}>This summary refreshes briefly while you view the entry. Check for updates if it takes longer.</Text>}
        <Action secondary disabled={query.isFetching || busy} onPress={() => { void query.refetch(); }}>{query.isFetching ? 'Checking…' : 'Check for updates'}</Action>
      </View>
      {entry.attachments.map((attachment, i) => <View key={attachment.id} style={styles.card}>
        {attachment.type === 'image' ? <Image source={{ uri: `data:${attachment.mimeType};base64,${attachment.base64}` }} style={{ width: '100%', aspectRatio: (attachment.widthPx ?? 4) / (attachment.heightPx ?? 3), borderRadius: 10 }} contentFit="contain" accessibilityLabel={`Saved photo ${i + 1}`} /> : <Text style={styles.text}>Audio attachment{attachment.durationMs ? ` · ${Math.round(attachment.durationMs / 1000)} seconds` : ''}</Text>}
      </View>)}
      {editError && <View style={styles.card}><Text style={styles.error}>{editError}</Text>
        {draft && <Action secondary disabled={busy} onPress={() => router.push(draftRoute(draft))}>Resume existing draft</Action>}
        {draft?.edit?.entryId === entry.id && !draft.savedEntryId && <Action secondary disabled={busy} onPress={() => setConfirmRestart(true)}>Restart edits with latest version</Action>}
      </View>}
      {confirmRestart && draft && <View style={styles.card}><Text style={styles.error}>Discard your unsaved edits and use this latest version?</Text>
        <Action secondary disabled={busy} onPress={() => {
          if (uploadStore.getState().discard(draft.id)) { setConfirmRestart(false); setEditError(null); }
        }}>Discard old edits</Action><Action secondary onPress={() => setConfirmRestart(false)}>Keep my edits</Action>
        <Text style={styles.muted}>After discarding, tap Edit entry to start again.</Text>
      </View>}
      <Action disabled={busy || query.isFetching} onPress={startEdit}>Edit entry</Action>
      {deletion.error && <Text accessibilityRole="alert" style={styles.error}>{deletion.error.message}</Text>}
      {confirmDelete ? <View style={styles.card}><Text style={styles.error}>Delete this entry from your account? This cannot be undone.</Text>
        <Action secondary disabled={busy} onPress={remove}>{deletion.isPending ? 'Deleting…' : 'Delete entry'}</Action>
        <Action secondary disabled={busy} onPress={() => setConfirmDelete(false)}>Keep entry</Action>
      </View> : <Action secondary disabled={busy} onPress={() => setConfirmDelete(true)}>Delete entry</Action>}
    </>}
  </UploadPage>;
}

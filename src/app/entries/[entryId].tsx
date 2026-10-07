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
import { analysisPending, analysisView } from '@/features/entries/analysis';
import { DetailsDisclosure, detailStyles } from '@/components/details-disclosure';
import { askKimo, mealQuestion } from '@/features/kimo/ask';
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
  return <UploadPage title={entry?.title ?? 'Entry'} subtitle={entry?.category === 'nutrition' ? capitalize(entry.data.mealCategory) : ''} onClose={() => closeTo(nav.backToOrigin)}>
    <StorageNotice />
    {!validId ? <Text style={styles.error}>This entry link is invalid.</Text> : query.isPending ? <ActivityIndicator accessibilityLabel="Loading entry" /> : !entry ? <View style={styles.card}>
      <Text accessibilityRole="alert" style={styles.error}>{query.error instanceof ApiError && query.error.status === 404 ? 'This entry was deleted or is not available to your account.' : query.error?.message ?? 'Could not load the entry.'}</Text>
      <Action secondary onPress={() => { void query.refetch(); }}>Try again</Action>
    </View> : <>
      {query.isError && <Text style={styles.error}>Could not refresh this entry. Showing the last loaded version.</Text>}
      <View style={styles.card}>
        {entry.category === 'nutrition' && <>
          <Text style={styles.title}>{Math.round(entry.summary.caloriesKcal ?? 0).toLocaleString('en-US')} kcal</Text>
          <Text style={styles.text}>{macroLine(entry.data.items)}</Text>
          {entry.data.items.map(food => <Text key={food.id} style={styles.muted}>{food.name} · {food.quantity} {food.unit} · {food.caloriesKcal ?? '?'} kcal</Text>)}
        </>}
        {entry.category === 'exercise' && <><Text style={styles.section}>{entry.data.activityName}</Text><Text style={styles.text}>{entry.data.durationMinutes} minutes · {entry.data.intensity}{entry.data.estimatedCaloriesBurnedKcal === null ? '' : ` · ~${Math.round(entry.data.estimatedCaloriesBurnedKcal)} kcal burned`}</Text>
          {entry.data.activities && entry.data.activities.length > 1 && entry.data.activities.map((activity, i) => <Text key={i} style={styles.muted}>{activity.activityName} · {activity.durationMinutes} min · ~{Math.round(activity.caloriesBurnedKcal)} kcal</Text>)}</>}
        {!!entry.note && <Text style={styles.text}>{entry.note}</Text>}
        <AnalysisSummary ai={entry.ai} />
        {entry.category === 'nutrition' && <Action secondary onPress={() => askKimo(mealQuestion(entry.title, entry.entryDate, entry.id))}>Ask Kimo about this meal</Action>}
        <DetailsDisclosure>
          <Text style={detailStyles.row}>Recorded: {new Date(entry.occurredAt).toLocaleString(undefined, { timeZone: entry.recordedTimezone })} ({entry.recordedTimezone}) · counted on {entry.entryDate}</Text>
          {entry.category === 'nutrition' && entry.data.items.map(food => <Text key={food.id} style={detailStyles.row}>{food.name}: {food.nutritionSource === 'reference' && food.reference ? providerLabel(food.reference.provider) : food.nutritionSource === 'estimated' ? 'Estimated' : 'Entered manually'} · P {food.proteinG ?? '?'} g · C {food.carbohydratesG ?? '?'} g · F {food.fatG ?? '?'} g</Text>)}
          {entry.category === 'exercise' && entry.data.estimatedCaloriesBurnedKcal !== null && <Text style={detailStyles.row}>Calories burned source: {entry.data.calorieEstimationSource === 'ai_met_estimate' ? 'Kimo estimate (MET × body weight)' : entry.data.calorieEstimationSource}</Text>}
          <Text style={detailStyles.row}>{analysisView(entry.ai).label}{entry.ai.errorCode ? ` (${entry.ai.errorCode})` : ''}</Text>
          {analysisPending(entry.ai) && <Action secondary disabled={query.isFetching || busy} onPress={() => { void query.refetch(); }}>{query.isFetching ? 'Checking…' : 'Check for analysis'}</Action>}
          <Text style={detailStyles.row}>Revision {entry.revision} · ID {entry.id}</Text>
        </DetailsDisclosure>
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

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
function macroLine(items: { proteinG: number | null; carbohydratesG: number | null; fatG: number | null }[]) {
  const sum = (key: 'proteinG' | 'carbohydratesG' | 'fatG') => Math.round(items.reduce((total, item) => total + (item[key] ?? 0), 0));
  return `Protein ${sum('proteinG')} g · Carbs ${sum('carbohydratesG')} g · Fat ${sum('fatG')} g`;
}

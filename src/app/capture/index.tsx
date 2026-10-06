import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useDemoNavigation } from '@/hooks/use-demo-navigation';
import { uploadStore } from '@/features/upload/store/upload-store';
import { usePhotos } from '@/features/upload/use-photos';
import type { EntryCategory } from '@/features/upload/schema';
import { Action, closeTo, draftRoute, StorageNotice, styles, UploadPage, useDraft } from '@/features/upload/components/shared';

export default function CaptureScreen() {
  const nav = useDemoNavigation();
  const { draft, ownerId, storageError, savingId } = useDraft();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const { pick, busy, error } = usePhotos();
  const start = async (category: EntryCategory, source?: 'camera' | 'gallery') => {
    uploadStore.getState().start(randomUUID(), category, nav.date, nav.origin);
    const next = uploadStore.getState().draft;
    if (!next) return;
    if (source && !await pick(source)) return;
    const current = uploadStore.getState().draft;
    if (current?.id === next.id) router.push(draftRoute(current));
  };
  return <UploadPage title="Add an entry" subtitle={`Record a meal, activity, or note for ${nav.date}.`} onClose={() => closeTo(nav.backToOrigin)}>
    <StorageNotice />{error && <Text style={styles.error}>{error}</Text>}
    {busy && <Text accessibilityLiveRegion="polite" style={styles.muted}>Preparing photos…</Text>}
    {draft ? <View style={styles.card}>
      <Text style={styles.section}>{draft.values.title.trim() || 'Unfinished entry'}</Text>
      <Text style={styles.muted}>{draft.values.entryDate} · {draft.values.category === 'nutrition' ? 'Meal' : draft.values.category} · {draft.photos.length} photos</Text>
      <Action disabled={busy || !!savingId} onPress={() => router.push(draftRoute(draft))}>Resume draft</Action>
      {confirmDiscard ? <>
        <Text style={styles.error}>Discard this draft and its photos? This cannot be undone.</Text>
        <Action secondary disabled={busy || !!savingId} onPress={() => { if (uploadStore.getState().discard(draft.id)) setConfirmDiscard(false); }}>Discard draft</Action>
        <Action secondary onPress={() => setConfirmDiscard(false)}>Keep draft</Action>
      </> : <Action secondary disabled={busy || !!savingId} onPress={() => setConfirmDiscard(true)}>Discard and start again</Action>}
    </View> : <>
      <View style={styles.card}><Text style={styles.section}>Start with a photo</Text><Text style={styles.muted}>Attach a meal photo, then enter the details you know.</Text>
        <Action disabled={!ownerId || !!storageError || busy} onPress={() => { void start('nutrition', 'camera'); }}>Take a photo</Action>
        <Action secondary disabled={!ownerId || !!storageError || busy} onPress={() => { void start('nutrition', 'gallery'); }}>Choose from gallery</Action>
      </View>
      <View style={styles.card}><Text style={styles.section}>Enter it yourself</Text>
        {(['nutrition', 'exercise', 'note'] as const).map(category => <Action key={category} secondary disabled={!ownerId || !!storageError || busy} onPress={() => { void start(category); }}>{category === 'nutrition' ? 'Log a meal' : category === 'exercise' ? 'Log exercise' : 'Write a note'}</Action>)}
      </View>
    </>}
  </UploadPage>;
}

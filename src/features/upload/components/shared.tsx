import { useEffect, type ReactNode } from 'react';
import { AppState, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Button, ButtonText } from '@/components/ui/Button';
import { useSessionStore } from '@/features/auth/store/session-store';
import { uploadStore, useUploadStore } from '../store/upload-store';
import type { UploadDraft } from '../store/create-upload-store';
import { usePhotos } from '../use-photos';
import { reportingDateSchema } from '@/features/home/schema/home-schema';

// Meals and workouts share the capture screen (title + note + photo); only legacy notes keep their own form.
export const formRoute = (category: UploadDraft['values']['category']) => category === 'note' ? '/entries/new-note' : '/capture';
export function draftRoute(draft: UploadDraft, review = false): Href {
  const date = reportingDateSchema.safeParse(draft.values.entryDate).success ? draft.values.entryDate : draft.sourceDate;
  return { pathname: review || draft.savedEntryId ? '/capture/review' : formRoute(draft.values.category), params: { date, origin: draft.origin } };
}
export function useDraft() {
  const accountId = useSessionStore(s => s.account?.id);
  const state = useUploadStore(s => s);
  useEffect(() => { if (accountId) uploadStore.getState().activate(accountId); }, [accountId]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', status => { if (status !== 'active') uploadStore.getState().flush(); });
    return () => { subscription.remove(); uploadStore.getState().flush(); };
  }, []);
  return { ...state, draft: state.ownerId === accountId ? state.draft : null };
}
export function Action({ children, onPress, disabled, secondary = false }: { children: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Button size="lg" variant={secondary ? 'outline' : 'default'} disabled={disabled} onPress={onPress} style={!secondary && styles.primary}><ButtonText>{children}</ButtonText></Button>;
}
export function UploadPage({ title, subtitle, children, onClose, eyebrow = 'YOUR DAILY LOG' }: { title: string; subtitle: string; children: ReactNode; onClose: () => void; eyebrow?: string }) {
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={styles.header}><Text style={styles.eyebrow}>{eyebrow}</Text><Button variant="ghost" onPress={onClose} accessibilityLabel="Close"><ButtonText>Close</ButtonText></Button></View>
      <Text style={styles.title}>{title}</Text><Text style={styles.muted}>{subtitle}</Text>{children}
    </ScrollView>
  </KeyboardAvoidingView>;
}
export function StorageNotice() {
  const error = useUploadStore(s => s.storageError);
  return error ? <View style={styles.card}><Text accessibilityRole="alert" style={styles.error}>{error}</Text>
    <Action secondary onPress={() => { uploadStore.getState().retryStorage(); }}>Retry draft storage</Action></View> : null;
}
export function Photos({ draft, title = 'Attachments', hint = 'Add context to your entry. Confirm the details yourself before reviewing.' }: { draft: UploadDraft; title?: string; hint?: string }) {
  const { pick, busy, error } = usePhotos();
  const saving = useUploadStore(s => !!s.savingId);
  const locked = busy || saving || !!draft.savedEntryId;
  return <View style={styles.card}>
    <Text style={styles.section}>{title} · {draft.photos.length}/10</Text>
    <Text style={styles.muted}>{hint}</Text>
    <View style={styles.row}>
      <Button variant="outline" disabled={locked} onPress={() => { void pick('camera'); }}><ButtonText>Take photo</ButtonText></Button>
      <Button variant="outline" disabled={locked} onPress={() => { void pick('gallery'); }}><ButtonText>Choose photos</ButtonText></Button>
    </View>
    {busy && <Text accessibilityLiveRegion="polite" style={styles.muted}>Preparing photos…</Text>}
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <View style={styles.row}>{draft.photos.map((photo, i) => <View key={photo.id} style={styles.photoCard}>
      {photo.type === 'image' ? <Image source={{ uri: `data:${photo.mimeType};base64,${photo.base64}` }} style={styles.photo} contentFit="cover" accessibilityLabel={`Attached photo ${i + 1}`} /> : <Text style={styles.text}>Audio attachment</Text>}
      <Button variant="ghost" disabled={locked} accessibilityLabel={`Remove attachment ${i + 1}`} onPress={() => uploadStore.getState().removePhoto(draft.id, photo.id)}><ButtonText>Remove</ButtonText></Button>
    </View>)}</View>
  </View>;
}
export function closeTo(href: Href) { uploadStore.getState().flush(); router.replace(href); }
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FAFAF8' }, content: { padding: 24, paddingBottom: 48, gap: 18, width: '100%', maxWidth: 620, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { fontSize: 11, letterSpacing: 1.5, color: '#71717A', fontWeight: '600' },
  title: { fontSize: 30, fontWeight: '600', color: '#18181B' }, muted: { color: '#71717A', fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E7', borderRadius: 16, padding: 18, gap: 14 },
  section: { fontSize: 18, fontWeight: '600', color: '#18181B' }, text: { color: '#18181B', fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, error: { color: '#B91C1C', fontSize: 14, lineHeight: 20 },
  primary: { backgroundColor: '#5856E8', minHeight: 48 }, photoCard: { width: 130 }, photo: { width: 130, height: 110, borderRadius: 10 },
});

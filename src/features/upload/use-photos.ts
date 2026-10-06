import { useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { randomUUID } from 'expo-crypto';
import { decodedBytes, MAX_PHOTOS, type DraftPhoto } from './schema';
import { uploadStore } from './store/upload-store';

export function usePhotos() {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pick = async (source: 'camera' | 'gallery') => {
    if (pending.current) return;
    const draft = uploadStore.getState().draft;
    if (!draft) return;
    if (draft.photos.length >= MAX_PHOTOS) { setError('Remove a photo before adding another. You can attach up to 10.'); return; }
    pending.current = true; setBusy(true); setError(null);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError(permission.canAskAgain ? 'Camera access was declined. You can use the gallery or enter details manually.' : 'Enable camera access in device settings, or use the gallery.'); return false;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, allowsEditing: false };
      const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) :
        await ImagePicker.launchImageLibraryAsync({ ...options, allowsMultipleSelection: true, selectionLimit: MAX_PHOTOS - draft.photos.length });
      if (result.canceled) return false;
      if (result.assets.length + draft.photos.length > MAX_PHOTOS) throw new Error('You can attach up to 10 photos.');
      const photos: DraftPhoto[] = [];
      for (const asset of result.assets) {
        // Normalize HEIC/AVIF and camera images to a supported JPEG; limit pixel memory and draft size.
        const context = ImageManipulator.manipulate(asset.uri);
        try {
          if (Math.max(asset.width, asset.height) > 2048) context.resize(asset.width >= asset.height ? { width: 2048 } : { height: 2048 });
          const image = await context.renderAsync();
          try {
            const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true });
            if (!saved.base64) throw new Error('Could not read this photo. Please try another.');
            photos.push({ id: randomUUID(), type: 'image', mimeType: 'image/jpeg', base64: saved.base64,
              fileSizeBytes: decodedBytes(saved.base64), widthPx: saved.width, heightPx: saved.height });
          } finally { image.release(); }
        } finally { context.release(); }
      }
      uploadStore.getState().addPhotos(draft.ownerId, draft.id, photos);
      return true;
    } catch (cause) {
      setError(cause instanceof Error && !('code' in cause) ? cause.message : 'Could not open or read your photos. Try again or enter details manually.');
      return false;
    } finally { pending.current = false; setBusy(false); }
  };
  return { pick, busy, error };
}

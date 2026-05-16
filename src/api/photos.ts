import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { DbProfilePhoto, DbProfilePhotoInsert } from '../types/db';

const BUCKET = 'profile-photos';

export async function listProfilePhotos(
  userId: string,
): Promise<DbProfilePhoto[]> {
  const { data, error } = await supabase
    .from('profile_photos')
    .select('*')
    .eq('user_id', userId)
    .order('photo_order', { ascending: true });
  if (error) {
    logger.warn('listProfilePhotos failed', { userId, message: error.message });
    return [];
  }
  return data ?? [];
}

export function getProfilePhotoPublicUrl(storagePath: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

// fileUri 는 expo-image-picker 가 반환한 로컬 URI.
// RN fetch 로 ArrayBuffer 로 읽어 Supabase Storage 에 업로드한다.
export async function uploadProfilePhoto(args: {
  userId: string;
  fileUri: string;
  photoOrder: number;
  profileId?: string | null;
  isPrimary?: boolean;
  contentType?: string;
}): Promise<DbProfilePhoto | null> {
  const { userId, fileUri, photoOrder } = args;
  const contentType = args.contentType ?? guessContentType(fileUri);
  const ext = contentTypeToExt(contentType);
  const storagePath = `${userId}/${photoOrder}-${Date.now()}.${ext}`;

  try {
    const res = await fetch(fileUri);
    const blob = await res.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, {
        contentType,
        upsert: true,
      });
    if (uploadErr) {
      logger.error('uploadProfilePhoto storage failed', {
        userId,
        message: uploadErr.message,
      });
      return null;
    }

    const insertRow: DbProfilePhotoInsert = {
      user_id: userId,
      storage_path: storagePath,
      photo_order: photoOrder,
      profile_id: args.profileId ?? null,
      is_primary: args.isPrimary ?? false,
    };

    const { data, error: insertErr } = await supabase
      .from('profile_photos')
      .insert(insertRow)
      .select('*')
      .maybeSingle();
    if (insertErr) {
      logger.error('uploadProfilePhoto db insert failed', {
        userId,
        message: insertErr.message,
      });
      return null;
    }
    return data;
  } catch (err) {
    logger.error('uploadProfilePhoto threw', {
      userId,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function deleteProfilePhoto(photoId: string): Promise<boolean> {
  const { data, error: fetchErr } = await supabase
    .from('profile_photos')
    .select('storage_path')
    .eq('id', photoId)
    .maybeSingle();
  if (fetchErr || !data) {
    logger.warn('deleteProfilePhoto fetch row failed', {
      photoId,
      message: fetchErr?.message,
    });
    return false;
  }

  const { error: removeErr } = await supabase.storage
    .from(BUCKET)
    .remove([data.storage_path]);
  if (removeErr) {
    logger.warn('deleteProfilePhoto storage remove failed', {
      photoId,
      message: removeErr.message,
    });
    // 진행 — DB row 는 정리 시도
  }

  const { error: deleteErr } = await supabase
    .from('profile_photos')
    .delete()
    .eq('id', photoId);
  if (deleteErr) {
    logger.error('deleteProfilePhoto db delete failed', {
      photoId,
      message: deleteErr.message,
    });
    return false;
  }
  return true;
}

function guessContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

function contentTypeToExt(ct: string): string {
  if (ct === 'image/png') return 'png';
  if (ct === 'image/webp') return 'webp';
  if (ct === 'image/heic') return 'heic';
  return 'jpg';
}

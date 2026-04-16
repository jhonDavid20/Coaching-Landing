'use server';

import { cookies } from 'next/headers';

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

/**
 * Upload a new avatar for the current user.
 *
 * Backend contract (tell your backend dev):
 *   PATCH /api/users/me/avatar
 *   Content-Type: multipart/form-data
 *   Field name: "file" (image/jpeg | image/png | image/webp | image/gif, max 5 MB)
 *   Authorization: Bearer <token>
 *
 *   Response 200: { url: string, message?: string }
 *     – `url` is the public CDN/storage URL of the new avatar.
 *     – Before saving the new file the backend MUST delete the previous avatar
 *       from storage (S3 / Cloudinary / disk) to avoid orphaned files.
 *
 *   Response 4xx/5xx: { message: string }
 */
export async function uploadAvatar(
  formData: FormData
): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return { success: false, message: 'Not authenticated' };

    const res = await fetch(`${apiUrl()}/api/users/me/avatar`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type — fetch sets it automatically with the
        // correct multipart boundary when body is a FormData instance.
      },
      body: formData,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    // Backend may return the URL under `url` or `avatar`
    const url: string | undefined = data?.url ?? data?.avatar ?? undefined;

    return {
      success: res.ok,
      url: res.ok ? url : undefined,
      message: data?.message ?? (res.ok ? 'Photo updated' : 'Upload failed'),
    };
  } catch (err) {
    console.error('uploadAvatar error:', err);
    return { success: false, message: 'Upload failed — please try again' };
  }
}

/**
 * Remove the current user's avatar.
 *
 * Backend contract:
 *   DELETE /api/users/me/avatar
 *   Authorization: Bearer <token>
 *
 *   The backend MUST delete the file from storage and set users.avatar = null.
 *   Response 200: { message: string }
 */
export async function deleteAvatar(): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return { success: false, message: 'Not authenticated' };

    const res = await fetch(`${apiUrl()}/api/users/me/avatar`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok,
      message: data?.message ?? (res.ok ? 'Photo removed' : 'Failed to remove photo'),
    };
  } catch (err) {
    console.error('deleteAvatar error:', err);
    return { success: false, message: 'Failed to remove photo' };
  }
}

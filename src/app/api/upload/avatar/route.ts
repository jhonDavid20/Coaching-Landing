import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

/**
 * PATCH /api/upload/avatar
 *
 * Proxies a multipart avatar upload from the browser to the backend.
 * Using a Route Handler (not a server action) so the File bytes are
 * streamed directly to the backend without Next.js re-serialising them.
 */
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Read the multipart body the browser sent
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Basic validation before forwarding
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Only image files are allowed' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'Image must be under 5 MB' }, { status: 400 });
    }

    // Forward to the backend.
    // IMPORTANT: We must read the file into an ArrayBuffer and recreate a Blob
    // before forwarding. Simply passing the File object from req.formData() into
    // another fetch can result in an empty body in some Node.js / Next.js versions
    // because the underlying ReadableStream is treated as already consumed.
    const buffer = await file.arrayBuffer();
    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const blob = new Blob([buffer], { type: file.type });
    const backendForm = new FormData();
    backendForm.append('file', blob, file.name || `avatar.${ext}`);

    const backendRes = await fetch(`${apiUrl()}/api/users/me/avatar`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type — fetch sets it with the correct boundary
      },
      body: backendForm,
    });

    const data = await backendRes.json().catch(() => ({}));

    // Normalise the URL field — backend may return `url` or `avatar`
    const url: string | undefined = data?.url ?? data?.avatar ?? undefined;

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data?.message ?? 'Upload failed' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json({ url, message: data?.message ?? 'Photo updated' });
  } catch (err) {
    console.error('[/api/upload/avatar] error:', err);
    return NextResponse.json({ message: 'Upload failed — please try again' }, { status: 500 });
  }
}

/**
 * DELETE /api/upload/avatar
 *
 * Proxies the delete request to the backend.
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const backendRes = await fetch(`${apiUrl()}/api/users/me/avatar`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(
      { message: data?.message ?? (backendRes.ok ? 'Photo removed' : 'Failed to remove photo') },
      { status: backendRes.ok ? 200 : backendRes.status }
    );
  } catch (err) {
    console.error('[/api/upload/avatar] DELETE error:', err);
    return NextResponse.json({ message: 'Failed to remove photo' }, { status: 500 });
  }
}

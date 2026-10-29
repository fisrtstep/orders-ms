import { JSON_HEADERS, timeout } from './http.js';

const base = () => process.env.IAM_BASE_URL;

// POST /auth/verify { token } -> { valid, userId, role }
export async function verifyToken(token) {
    const res = await fetch(`${base()}/auth/verify`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ token }),
        signal: timeout(),
    });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error(`iam-ms responded ${res.status}`);
    const body = await res.json();
    return body.valid ? { userId: body.userId, role: body.role } : null;
}

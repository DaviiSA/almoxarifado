import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearAuthCookie } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

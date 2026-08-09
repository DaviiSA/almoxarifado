import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  res.json({ user });
}

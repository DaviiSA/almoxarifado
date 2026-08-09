import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, handleApiError } from './_lib/auth';
import { computeInventory } from './_lib/inventory';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    const { estoque } = await computeInventory();
    res.json(estoque.sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR')));
  } catch (error) {
    handleApiError(res, error);
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin, handleApiError } from '../_lib/auth';
import { updateRowById } from '../_lib/sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireAdmin(req, res);
  if (!user) return;

  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método não permitido' });

  const { id } = req.query;
  const { descricao, unidade, categoria, estoqueMinimo, observacoes } = req.body ?? {};

  try {
    const ok = await updateRowById('Materiais', String(id), [
      String(id),
      descricao,
      unidade,
      categoria,
      Number(estoqueMinimo) || 0,
      observacoes || '',
    ]);
    if (!ok) return res.status(404).json({ error: 'Material não encontrado.' });
    res.json({ message: 'Material atualizado com sucesso.' });
  } catch (error) {
    handleApiError(res, error);
  }
}

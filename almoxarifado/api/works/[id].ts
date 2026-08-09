import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin, handleApiError } from '../_lib/auth';
import { updateRowById } from '../_lib/sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireAdmin(req, res);
  if (!user) return;

  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método não permitido' });

  const { id } = req.query;
  const { nome, contratante, dataInicio, status, tipo, observacoes } = req.body ?? {};

  try {
    const ok = await updateRowById('Obras', String(id), [
      String(id),
      nome,
      contratante,
      dataInicio,
      status,
      tipo,
      observacoes || '',
    ]);
    if (!ok) return res.status(404).json({ error: 'Obra não encontrada.' });
    res.json({ message: 'Obra atualizada com sucesso.' });
  } catch (error) {
    handleApiError(res, error);
  }
}

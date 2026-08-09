import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, requireAdmin, handleApiError } from '../_lib/auth';
import { readSheet, appendRow } from '../_lib/sheets';
import type { Obra } from '../../src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const user = requireAuth(req, res);
      if (!user) return;
      const works = await readSheet<Obra>('Obras', (r) => ({
        id: r[0],
        nome: r[1],
        contratante: r[2],
        dataInicio: r[3],
        status: (r[4] as Obra['status']) || 'Em andamento',
        tipo: r[5],
        observacoes: r[6] || undefined,
      }));
      return res.json(works);
    }

    if (req.method === 'POST') {
      const user = requireAdmin(req, res);
      if (!user) return;
      const { nome, contratante, dataInicio, status, tipo, observacoes } = req.body ?? {};
      if (!nome || !contratante || !dataInicio || !tipo) {
        return res.status(400).json({ error: 'Preencha nome, contratante, data de início e tipo.' });
      }
      const id = `OBR-${Date.now()}`;
      await appendRow('Obras', [id, nome, contratante, dataInicio, status || 'Em andamento', tipo, observacoes || '']);
      return res.status(201).json({ message: 'Obra cadastrada com sucesso.', id });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    handleApiError(res, error);
  }
}

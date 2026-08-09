import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, requireAdmin, handleApiError } from '../_lib/auth';
import { readSheet, appendRow } from '../_lib/sheets';
import type { Material } from '../../src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const user = requireAuth(req, res);
      if (!user) return;
      const materials = await readSheet<Material>('Materiais', (r) => ({
        id: r[0],
        descricao: r[1],
        unidade: r[2],
        categoria: r[3],
        estoqueMinimo: Number(r[4] || 0),
        observacoes: r[5] || undefined,
      }));
      return res.json(materials);
    }

    if (req.method === 'POST') {
      const user = requireAdmin(req, res);
      if (!user) return;
      const { descricao, unidade, categoria, estoqueMinimo, observacoes } = req.body ?? {};
      if (!descricao || !unidade || !categoria) {
        return res.status(400).json({ error: 'Preencha descrição, unidade e categoria.' });
      }
      const id = `MAT-${Date.now()}`;
      await appendRow('Materiais', [id, descricao, unidade, categoria, Number(estoqueMinimo) || 0, observacoes || '']);
      return res.status(201).json({ message: 'Material cadastrado com sucesso.', id });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    handleApiError(res, error);
  }
}

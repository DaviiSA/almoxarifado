import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, requireAdmin, handleApiError } from '../_lib/auth';
import { readSheet, appendRow } from '../_lib/sheets';
import type { Entrada } from '../../src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const user = requireAuth(req, res);
      if (!user) return;
      const entries = await readSheet<Entrada>('Entradas', (r) => ({
        id: r[0],
        data: r[1],
        tipoEstoque: (r[2] as Entrada['tipoEstoque']) || 'Particular',
        obraId: r[3] || undefined,
        materialId: r[4],
        quantidade: Number(r[5] || 0),
        fornecedor: r[6],
        notaFiscal: r[7],
        recebidoPor: r[8],
        observacoes: r[9] || undefined,
      }));
      return res.json(entries.sort((a, b) => (a.data < b.data ? 1 : -1)));
    }

    if (req.method === 'POST') {
      // Somente administradores registram entradas de material no almoxarifado.
      const user = requireAdmin(req, res);
      if (!user) return;
      const { data, tipoEstoque, obraId, materialId, quantidade, fornecedor, notaFiscal, observacoes } = req.body ?? {};
      if (!data || !tipoEstoque || !materialId || !quantidade || !fornecedor) {
        return res.status(400).json({ error: 'Preencha data, tipo de estoque, material, quantidade e fornecedor.' });
      }
      const id = `ENT-${Date.now()}`;
      await appendRow('Entradas', [
        id, data, tipoEstoque, obraId || '', materialId, Number(quantidade),
        fornecedor, notaFiscal || '', user.nome, observacoes || '',
      ]);
      return res.status(201).json({ message: 'Entrada registrada com sucesso.', id });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    handleApiError(res, error);
  }
}

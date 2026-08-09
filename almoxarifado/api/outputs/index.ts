import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, handleApiError } from '../_lib/auth';
import { readSheet, appendRow } from '../_lib/sheets';
import type { Saida } from '../../src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const user = requireAuth(req, res);
      if (!user) return;
      const outputs = await readSheet<Saida>('Saidas', (r) => ({
        id: r[0],
        data: r[1],
        tipoEstoque: (r[2] as Saida['tipoEstoque']) || 'Particular',
        obraId: r[3],
        materialId: r[4],
        quantidade: Number(r[5] || 0),
        origemComplemento: r[6] || undefined,
        equipeResponsavel: r[7],
        retiradoPor: r[8],
        observacoes: r[9] || undefined,
      }));
      return res.json(outputs.sort((a, b) => (a.data < b.data ? 1 : -1)));
    }

    if (req.method === 'POST') {
      // ADMIN e EQUIPE podem retirar material do almoxarifado para uma obra.
      const user = requireAuth(req, res);
      if (!user) return;
      const { data, tipoEstoque, obraId, materialId, quantidade, origemComplemento, equipeResponsavel, observacoes } = req.body ?? {};
      if (!data || !tipoEstoque || !obraId || !materialId || !quantidade || !equipeResponsavel) {
        return res.status(400).json({ error: 'Preencha data, tipo de estoque, obra, material, quantidade e equipe responsável.' });
      }
      const id = `SAI-${Date.now()}`;
      await appendRow('Saidas', [
        id, data, tipoEstoque, obraId, materialId, Number(quantidade),
        origemComplemento || '', equipeResponsavel, user.nome, observacoes || '',
      ]);
      return res.status(201).json({ message: 'Saída registrada com sucesso.', id });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    handleApiError(res, error);
  }
}

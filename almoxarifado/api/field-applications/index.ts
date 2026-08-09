import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, handleApiError } from '../_lib/auth';
import { readSheet, appendRow } from '../_lib/sheets';
import type { AplicacaoCampo } from '../../src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const user = requireAuth(req, res);
      if (!user) return;
      const apps = await readSheet<AplicacaoCampo>('Aplicacoes', (r) => ({
        id: r[0],
        data: r[1],
        obraId: r[2],
        materialId: r[3],
        quantidadeAplicada: Number(r[4] || 0),
        quantidadeSobra: Number(r[5] || 0),
        equipe: r[6],
        localizacao: r[7],
        responsavel: r[8],
        observacoes: r[9] || undefined,
      }));
      return res.json(apps.sort((a, b) => (a.data < b.data ? 1 : -1)));
    }

    if (req.method === 'POST') {
      const user = requireAuth(req, res);
      if (!user) return;
      const { data, obraId, materialId, quantidadeAplicada, quantidadeSobra, equipe, localizacao, observacoes } = req.body ?? {};
      if (!data || !obraId || !materialId || quantidadeAplicada === undefined || !equipe || !localizacao) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios da aplicação em campo.' });
      }
      const id = `APP-${Date.now()}`;
      await appendRow('Aplicacoes', [
        id, data, obraId, materialId, Number(quantidadeAplicada), Number(quantidadeSobra) || 0,
        equipe, localizacao, user.nome, observacoes || '',
      ]);
      return res.status(201).json({ message: 'Aplicação em campo registrada com sucesso.', id });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    handleApiError(res, error);
  }
}

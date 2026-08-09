import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin, handleApiError } from '../_lib/auth';
import { readSheetRows, updateRowById } from '../_lib/sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireAdmin(req, res);
  if (!user) return;

  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método não permitido' });

  const { id } = req.query;
  const { ativo, perfil, equipeVinculada } = req.body ?? {};

  try {
    const rows = await readSheetRows('Usuarios');
    const row = rows.find((r) => r[0] === String(id));
    if (!row) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const updated = [
      row[0],
      row[1],
      row[2],
      row[3], // senhaHash preservado
      perfil ?? row[4],
      equipeVinculada ?? row[5],
      ativo === undefined ? row[6] : String(ativo),
    ];
    await updateRowById('Usuarios', String(id), updated);
    res.json({ message: 'Usuário atualizado com sucesso.' });
  } catch (error) {
    handleApiError(res, error);
  }
}

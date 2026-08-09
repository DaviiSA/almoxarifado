import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin, handleApiError } from './_lib/auth';
import { checkSheetsStatus, provisionMissingSheets } from './_lib/sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireAdmin(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') {
      const { existentes, faltando } = await checkSheetsStatus();
      return res.json({ configurado: faltando.length === 0, abasExistentes: existentes, abasFaltando: faltando });
    }
    if (req.method === 'POST') {
      const criadas = await provisionMissingSheets();
      const { existentes, faltando } = await checkSheetsStatus();
      return res.json({
        criadas,
        configurado: faltando.length === 0,
        abasExistentes: existentes,
        abasFaltando: faltando,
      });
    }
    res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    handleApiError(res, error);
  }
}

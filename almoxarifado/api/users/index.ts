import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { requireAdmin, handleApiError } from '../_lib/auth';
import { readSheet, appendRow } from '../_lib/sheets';
import type { Usuario } from '../../src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireAdmin(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') {
      const usuarios = await readSheet<Usuario>('Usuarios', (r) => ({
        id: r[0],
        nome: r[1],
        email: r[2],
        perfil: (r[4] as Usuario['perfil']) || 'EQUIPE',
        equipeVinculada: r[5] || undefined,
        ativo: r[6] !== 'false' && r[6] !== '0' && r[6] !== '',
      }));
      return res.json(usuarios);
    }

    if (req.method === 'POST') {
      const { nome, email, senha, perfil, equipeVinculada } = req.body ?? {};
      if (!nome || !email || !senha || !perfil) {
        return res.status(400).json({ error: 'Preencha nome, e-mail, senha e perfil.' });
      }
      if (String(senha).length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      }
      const existentes = await readSheet<{ email: string }>('Usuarios', (r) => ({ email: (r[2] || '').toLowerCase() }));
      if (existentes.some((u) => u.email === String(email).toLowerCase())) {
        return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
      }
      const senhaHash = await bcrypt.hash(String(senha), 10);
      const id = `USR-${Date.now()}`;
      await appendRow('Usuarios', [
        id, nome, String(email).toLowerCase(), senhaHash, perfil, equipeVinculada || '', 'true',
      ]);
      return res.status(201).json({ message: 'Usuário cadastrado com sucesso.', id });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    handleApiError(res, error);
  }
}

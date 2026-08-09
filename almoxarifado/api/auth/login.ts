import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { signUser, setAuthCookie } from '../_lib/auth';
import { readSheet, SheetsNotConfiguredError } from '../_lib/sheets';
import type { AuthUser } from '../../src/types';

interface UsuarioRow {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  perfil: 'ADMIN' | 'EQUIPE';
  equipeVinculada?: string;
  ativo: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // 1) Conta administradora "de emergência", sempre disponível via variáveis de ambiente.
  const bootstrapEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (bootstrapEmail && normalizedEmail === bootstrapEmail && password === process.env.ADMIN_PASSWORD) {
    const user: AuthUser = { id: 'admin-bootstrap', nome: 'Administrador', email: normalizedEmail, perfil: 'ADMIN' };
    setAuthCookie(res, signUser(user));
    return res.json({ user });
  }

  // 2) Usuários cadastrados na planilha (aba "Usuarios").
  try {
    const usuarios = await readSheet<UsuarioRow>('Usuarios', (r) => ({
      id: r[0],
      nome: r[1],
      email: (r[2] || '').toLowerCase(),
      senhaHash: r[3],
      perfil: (r[4] as 'ADMIN' | 'EQUIPE') || 'EQUIPE',
      equipeVinculada: r[5] || undefined,
      ativo: r[6] !== 'false' && r[6] !== '0' && r[6] !== '',
    }));

    const found = usuarios.find((u) => u.email === normalizedEmail);
    if (!found || !found.ativo) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    const valid = await bcrypt.compare(password, found.senhaHash || '');
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    const user: AuthUser = {
      id: found.id,
      nome: found.nome,
      email: found.email,
      perfil: found.perfil,
      equipeVinculada: found.equipeVinculada,
    };
    setAuthCookie(res, signUser(user));
    return res.json({ user });
  } catch (error) {
    if (error instanceof SheetsNotConfiguredError) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Não foi possível validar o login agora.' });
  }
}

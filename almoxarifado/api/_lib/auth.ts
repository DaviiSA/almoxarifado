import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import type { AuthUser } from '../../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'almox_token';

export function signUser(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '12h' });
}

export function setAuthCookie(res: VercelResponse, token: string) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    }),
  );
}

export function clearAuthCookie(res: VercelResponse) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    }),
  );
}

export function getUserFromRequest(req: VercelRequest): AuthUser | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const parsed = cookie.parse(raw);
  const token = parsed[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

/** Garante que existe um usuário autenticado; responde 401 e retorna null se não houver. */
export function requireAuth(req: VercelRequest, res: VercelResponse): AuthUser | null {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    return null;
  }
  return user;
}

/** Garante que o usuário autenticado é ADMIN; responde 403 e retorna null se não for. */
export function requireAdmin(req: VercelRequest, res: VercelResponse): AuthUser | null {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.perfil !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas administradores podem realizar esta ação.' });
    return null;
  }
  return user;
}

export function handleApiError(res: VercelResponse, error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.';
  const isConfigError = message.includes('planilha do Google ainda não foi configurada');
  console.error(error);
  res.status(isConfigError ? 503 : 500).json({ error: message });
}

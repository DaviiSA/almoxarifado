/**
 * Auth.gs — hash de senha (salted SHA-256) e sessões via CacheService.
 * Não há cookies nem JWT: o token é gerado no login e devolvido ao cliente,
 * que o reenvia em toda chamada de google.script.run.
 */

const SESSION_TTL_SECONDS = 6 * 60 * 60; // 6h — máximo permitido pelo CacheService

function hashWithSalt_(password, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, `${password}::${salt}`);
  return bytes.map((b) => ((b < 0 ? b + 256 : b).toString(16).padStart(2, '0'))).join('');
}

function makePasswordHash_(password) {
  const salt = Utilities.getUuid();
  return `${salt}$${hashWithSalt_(password, salt)}`;
}

function verifyPassword_(password, stored) {
  if (!stored || stored.indexOf('$') === -1) return false;
  const [salt, hash] = stored.split('$');
  return hashWithSalt_(password, salt) === hash;
}

function createSession_(user) {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(`session_${token}`, JSON.stringify(user), SESSION_TTL_SECONDS);
  return token;
}

function getSessionUser_(token) {
  if (!token) return null;
  const raw = CacheService.getScriptCache().get(`session_${token}`);
  return raw ? JSON.parse(raw) : null;
}

function requireAuth_(token) {
  const user = getSessionUser_(token);
  if (!user) throw new Error('Sessão expirada. Faça login novamente.');
  return user;
}

function requireAdmin_(token) {
  const user = requireAuth_(token);
  if (user.perfil !== 'ADMIN') throw new Error('Apenas administradores podem realizar esta ação.');
  return user;
}

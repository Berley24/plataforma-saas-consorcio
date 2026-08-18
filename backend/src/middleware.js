import { verifyToken } from './auth.js';
import { db } from './db.js';

// Extrai o Bearer token e injeta o usuário autenticado.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  try {
    const payload = verifyToken(token);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub || payload.userId);
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });
    req.user = user;
    req.auth = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador.' });
  }
  return next();
}

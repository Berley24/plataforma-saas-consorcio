import { Router } from 'express';
import {
  createUser,
  findUserByEmail,
  hashPassword,
  verifyPassword,
  signToken,
  findConsultantByUserId,
  defaultContent,
} from '../auth.js';
import { requireAuth } from '../middleware.js';
import { db, genSlug, uniqueSlug } from '../db.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register — cadastro de consultor
router.post('/register', (req, res) => {
  const { name, email, password, whatsapp } = req.body || {};
  const cleanName = String(name || '').trim().slice(0, 120);
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanWhatsapp = String(whatsapp || '').replace(/\D/g, '').slice(0, 13);

  if (!cleanName) return res.status(400).json({ error: 'Informe seu nome.' });
  if (!EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: 'E-mail inválido.' });
  if (!password || String(password).length < 8)
    return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });

  if (findUserByEmail(cleanEmail)) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
  }

  const slug = uniqueSlug(genSlug(cleanName));
  const { userId, consultantId } = createUser({
    email: cleanEmail,
    password: String(password),
    name: cleanName,
    slug,
  });

  // guarda WhatsApp inicial no conteúdo padrão
  const content = defaultContent();
  content.identity.name = cleanName;
  content.identity.whatsapp = cleanWhatsapp;
  db.prepare('UPDATE consultant_content SET content = ? WHERE consultant_id = ?').run(
    JSON.stringify(content),
    consultantId
  );

  const token = signToken({ sub: userId, role: 'consultant' });
  res.status(201).json({
    token,
    user: { id: userId, email: cleanEmail, name: cleanName, role: 'consultant' },
    consultantId,
  });
});

// POST /api/auth/login — login de consultor ou admin
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const user = findUserByEmail(cleanEmail);
  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  const token = signToken({ sub: user.id, role: user.role });
  const payload = {
    token,
    user: { id: user.id, email: user.email, name: user.email, role: user.role },
  };
  if (user.role === 'consultant') {
    const consultant = findConsultantByUserId(user.id);
    payload.user.name = consultant?.display_name || user.email;
    payload.consultantId = consultant?.id;
    payload.slug = consultant?.slug;
  }
  res.json(payload);
});

// GET /api/auth/me — usuário atual
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  const payload = { user };
  if (user.role === 'consultant') {
    const consultant = db
      .prepare('SELECT * FROM consultants WHERE user_id = ?')
      .get(user.id);
    const contentRow = db
      .prepare('SELECT content FROM consultant_content WHERE consultant_id = ?')
      .get(consultant?.id);
    payload.consultant = consultant
      ? { ...consultant, content: JSON.parse(contentRow?.content || '{}') }
      : null;
  }
  res.json(payload);
});

// POST /api/auth/admin/setup — cria/atualiza a senha do admin (segredo via env)
router.post('/admin/setup', (req, res) => {
  const secret = process.env.ADMIN_SETUP_SECRET;
  if (!secret) {
    return res.status(403).json({ error: 'Setup do admin desabilitado.' });
  }
  if (String(req.body?.secret) !== secret) {
    return res.status(403).json({ error: 'Segredo inválido.' });
  }
  const email = String(req.body?.email || process.env.ADMIN_EMAIL || 'admin@consorciofy.com').toLowerCase();
  const password = String(req.body?.password || process.env.ADMIN_PASSWORD || 'admin12345');
  if (password.length < 8) return res.status(400).json({ error: 'Senha deve ter 8+ caracteres.' });

  let admin = findUserByEmail(email);
  if (admin) {
    db.prepare('UPDATE users SET password_hash = ?, role = ?, updated_at = ? WHERE id = ?').run(
      hashPassword(password),
      'admin',
      new Date().toISOString(),
      admin.id
    );
  } else {
    db.prepare(
      "INSERT INTO users (email, password_hash, role, created_at, updated_at) VALUES (?, ?, 'admin', ?, ?)"
    ).run(email, hashPassword(password), new Date().toISOString(), new Date().toISOString());
    admin = findUserByEmail(email);
  }
  res.json({ ok: true, message: 'Admin configurado.', email });
});

export default router;

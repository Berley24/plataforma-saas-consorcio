import { Router } from 'express';
import { db, nowIso } from '../db.js';
import { getStatus, isActive } from '../services/payment.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicConsultant(slug) {
  return db.prepare('SELECT * FROM consultants WHERE slug = ?').get(slug);
}

// GET /api/public/:slug — página pública do consultor
router.get('/:slug', (req, res) => {
  const consultant = publicConsultant(req.params.slug);
  if (!consultant) {
    return res.status(404).json({ error: 'Consultor não encontrado.' });
  }

  const status = getStatus(consultant);
  const blocked = status === 'blocked' || status === 'none' || status === 'cancelled';

  if (blocked) {
    return res.status(403).json({
      unavailable: true,
      code: status === 'blocked' ? 'blocked' : 'not_active',
      message:
        status === 'blocked'
          ? 'Página temporariamente indisponível.'
          : 'Página indisponível no momento.',
    });
  }

  const contentRow = db
    .prepare('SELECT content FROM consultant_content WHERE consultant_id = ?')
    .get(consultant.id);

  res.json({
    slug: consultant.slug,
    displayName: consultant.display_name,
    content: JSON.parse(contentRow?.content || '{}'),
  });
});

// POST /api/public/:slug/lead — formulário de contato (salva no banco)
router.post('/:slug/lead', (req, res) => {
  const consultant = publicConsultant(req.params.slug);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });
  if (!isActive(consultant)) return res.status(403).json({ error: 'Página indisponível.' });

  const { name, whatsapp, email, message } = req.body || {};
  const cleanName = String(name || '').trim().slice(0, 120);
  const cleanWhatsapp = String(whatsapp || '').replace(/\D/g, '').slice(0, 13);
  const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 160);
  const cleanMessage = String(message || '').trim().slice(0, 2000);

  if (!cleanName) return res.status(400).json({ error: 'Informe seu nome.' });
  if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }
  if (!cleanName && !cleanEmail && !cleanWhatsapp) {
    return res.status(400).json({ error: 'Informe ao menos um canal de contato.' });
  }

  // rate-limit simples por consultor (máx. 5/min)
  const since = new Date(Date.now() - 60_000).toISOString();
  const recent = db
    .prepare(
      'SELECT COUNT(*) AS n FROM leads WHERE consultant_id = ? AND created_at >= ?'
    )
    .get(consultant.id, since);
  if (recent.n >= 5) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde um instante.' });
  }

  db.prepare(
    `INSERT INTO leads (consultant_id, name, whatsapp, email, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    consultant.id,
    cleanName,
    cleanWhatsapp,
    cleanEmail,
    cleanMessage,
    nowIso()
  );

  res.status(201).json({ ok: true });
});

export default router;

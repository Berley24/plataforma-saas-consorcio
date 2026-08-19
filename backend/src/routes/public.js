import { Router } from 'express';
import { db, nowIso } from '../db.js';
import { getStatus, isActive } from '../services/payment.js';
import { chat } from '../services/ai.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTERESTS = ['carro', 'casa', 'moto', 'servicos', 'alavancagem', 'agro', 'outro'];

function publicConsultant(slug) {
  return db.prepare('SELECT * FROM consultants WHERE slug = ?').get(slug);
}

function loadContent(consultant) {
  const row = db
    .prepare('SELECT content FROM consultant_content WHERE consultant_id = ?')
    .get(consultant.id);
  return JSON.parse(row?.content || '{}');
}

function rateLimit(consultantId) {
  const since = new Date(Date.now() - 60_000).toISOString();
  const recent = db
    .prepare('SELECT COUNT(*) AS n FROM leads WHERE consultant_id = ? AND created_at >= ?')
    .get(consultantId, since);
  return recent.n >= 5;
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

// POST /api/public/:slug/chat — assistente de simulação (conversa com o visitante)
router.post('/:slug/chat', async (req, res) => {
  const consultant = publicConsultant(req.params.slug);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });
  if (!isActive(consultant)) return res.status(403).json({ error: 'Página indisponível.' });
  if (rateLimit(consultant.id)) {
    return res.status(429).json({ error: 'Muitas mensagens. Aguarde um instante.' });
  }

  const history = Array.isArray(req.body?.messages) ? req.body.messages.slice(-16) : [];
  const cleanHistory = history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({ role: m.role, content: String(m.content || '').slice(0, 500) }));
  const last = cleanHistory[cleanHistory.length - 1];
  if (!last || last.role !== 'user' || !last.content.trim()) {
    return res.status(400).json({ error: 'Envie uma mensagem.' });
  }

  const content = loadContent(consultant);
  try {
    const result = await chat(cleanHistory, consultant, content);
    res.json({
      reply: result.reply,
      intent: INTERESTS.includes(result.intent) ? result.intent : 'outro',
      ready_for_meeting: Boolean(result.ready_for_meeting),
      profile: result.profile || {},
    });
  } catch (err) {
    console.error('[chat] erro:', err);
    res.status(500).json({ error: 'Não consegui responder agora. Tente de novo em instantes.' });
  }
});

// POST /api/public/:slug/lead — formulário de contato ou agendamento de reunião
router.post('/:slug/lead', (req, res) => {
  const consultant = publicConsultant(req.params.slug);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });
  if (!isActive(consultant)) return res.status(403).json({ error: 'Página indisponível.' });

  const { name, whatsapp, email, message, interest, meeting_at, meeting_notes } = req.body || {};
  const cleanName = String(name || '').trim().slice(0, 120);
  const cleanWhatsapp = String(whatsapp || '').replace(/\D/g, '').slice(0, 13);
  const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 160);
  const cleanMessage = String(message || '').trim().slice(0, 2000);
  const cleanInterest = INTERESTS.includes(String(interest || '').toLowerCase())
    ? String(interest).toLowerCase()
    : String(interest || '').trim().slice(0, 40) || null;
  const cleanNotes = String(meeting_notes || '').trim().slice(0, 2000);

  if (!cleanName) return res.status(400).json({ error: 'Informe seu nome.' });
  if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }
  if (!cleanName && !cleanEmail && !cleanWhatsapp) {
    return res.status(400).json({ error: 'Informe ao menos um canal de contato.' });
  }

  // validação do agendamento
  let cleanMeetingAt = null;
  let source = 'form';
  if (meeting_at) {
    const d = new Date(meeting_at);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ error: 'Data da reunião inválida.' });
    }
    if (d.getTime() <= Date.now() - 5 * 60_000) {
      return res.status(400).json({ error: 'Escolha uma data futura.' });
    }
    if (d.getTime() > Date.now() + 120 * 24 * 60 * 60_000) {
      return res.status(400).json({ error: 'Data muito distante.' });
    }
    cleanMeetingAt = d.toISOString();
    source = 'chat';
  }

  // rate-limit simples por consultor (máx. 5/min)
  if (rateLimit(consultant.id)) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde um instante.' });
  }

  db.prepare(
    `INSERT INTO leads (consultant_id, name, whatsapp, email, message, interest, meeting_at, meeting_notes, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    consultant.id,
    cleanName,
    cleanWhatsapp,
    cleanEmail,
    cleanMessage,
    cleanInterest,
    cleanMeetingAt,
    cleanNotes,
    source,
    nowIso()
  );

  res.status(201).json({ ok: true, meeting_scheduled: Boolean(cleanMeetingAt) });
});

export default router;

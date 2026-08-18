import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware.js';
import { db, nowIso, runBackup } from '../db.js';

const router = Router();

function recordAdminAction(req, action, consultantId, detail) {
  db.prepare(
    'INSERT INTO admin_actions (admin_id, action, consultant_id, detail, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.id, action, consultantId || null, detail || null, nowIso());
}

// GET /api/admin/consultants — lista completa de consultores
router.get('/consultants', requireAuth, requireAdmin, (req, res) => {
  const consultants = db
    .prepare(
      `SELECT c.id, c.slug, c.display_name, c.plan, c.subscription_status,
              c.current_period_end, c.active_until, c.blocked_at, c.blocked_reason,
              c.created_at, u.email
       FROM consultants c JOIN users u ON u.id = c.user_id
       ORDER BY c.created_at DESC`
    )
    .all();
  res.json({ consultants });
});

// GET /api/admin/consultants/:id — detalhe + conteúdo + leads
router.get('/consultants/:id', requireAuth, requireAdmin, (req, res) => {
  const consultant = db
    .prepare(
      `SELECT c.*, u.email FROM consultants c JOIN users u ON u.id = c.user_id WHERE c.id = ?`
    )
    .get(req.params.id);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });

  const contentRow = db
    .prepare('SELECT content FROM consultant_content WHERE consultant_id = ?')
    .get(consultant.id);
  const leads = db
    .prepare('SELECT * FROM leads WHERE consultant_id = ? ORDER BY created_at DESC')
    .all(consultant.id);
  const actions = db
    .prepare('SELECT * FROM admin_actions WHERE consultant_id = ? ORDER BY created_at DESC')
    .all(consultant.id);

  res.json({
    consultant: { ...consultant, content: JSON.parse(contentRow?.content || '{}') },
    leads,
    actions,
  });
});

// POST /api/admin/consultants/:id/block — bloqueia manualmente
router.post('/consultants/:id/block', requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const consultant = db.prepare('SELECT * FROM consultants WHERE id = ?').get(id);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });

  const reason = String(req.body?.reason || 'Bloqueio manual pelo administrador.').slice(0, 300);
  db.prepare(
    `UPDATE consultants SET subscription_status = 'blocked', blocked_reason = ?, blocked_at = ?, updated_at = ? WHERE id = ?`
  ).run(reason, nowIso(), nowIso(), id);
  recordAdminAction(req, 'block', Number(id), reason);
  res.json({ ok: true, blocked: true });
});

// POST /api/admin/consultants/:id/unblock — libera manualmente
router.post('/consultants/:id/unblock', requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const consultant = db.prepare('SELECT * FROM consultants WHERE id = ?').get(id);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });

  db.prepare(
    `UPDATE consultants SET subscription_status = 'active', blocked_reason = NULL, blocked_at = NULL, active_until = ?, updated_at = ? WHERE id = ?`
  ).run(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(), nowIso(), id);
  recordAdminAction(req, 'unblock', Number(id), 'Acesso liberado manualmente.');
  res.json({ ok: true, blocked: false });
});

// GET /api/admin/leads — todos os leads (visão global)
router.get('/leads', requireAuth, requireAdmin, (req, res) => {
  const leads = db
    .prepare(
      `SELECT l.*, c.slug, c.display_name FROM leads l
       JOIN consultants c ON c.id = l.consultant_id
       ORDER BY l.created_at DESC LIMIT 500`
    )
    .all();
  res.json({ leads });
});

// POST /api/admin/backup — backup imediato do banco
router.post('/backup', requireAuth, requireAdmin, (req, res) => {
  const dest = runBackup();
  recordAdminAction(req, 'backup', null, dest);
  res.json({ ok: true, file: dest });
});

export default router;

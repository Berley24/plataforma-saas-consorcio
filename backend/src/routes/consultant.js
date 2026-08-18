import { Router } from 'express';
import { requireAuth } from '../middleware.js';
import { db, nowIso, genSlug, uniqueSlug } from '../db.js';
import { sanitizeContent } from '../validation.js';

const router = Router();

// Toda rota aqui exige autenticação e manipula APENAS o consultor dono da conta.

function ownConsultant(req) {
  return db
    .prepare('SELECT * FROM consultants WHERE user_id = ?')
    .get(req.user.id);
}

// GET /api/consultant/page — minha página (conteúdo + status)
router.get('/page', requireAuth, (req, res) => {
  if (req.user.role !== 'consultant') {
    return res.status(403).json({ error: 'Acesso restrito a consultores.' });
  }
  const consultant = ownConsultant(req);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });
  const contentRow = db
    .prepare('SELECT content FROM consultant_content WHERE consultant_id = ?')
    .get(consultant.id);
  res.json({
    consultant: {
      id: consultant.id,
      slug: consultant.slug,
      displayName: consultant.display_name,
      plan: consultant.plan,
      subscription_status: consultant.subscription_status,
      current_period_end: consultant.current_period_end,
      active_until: consultant.active_until,
      blocked_at: consultant.blocked_at,
      created_at: consultant.created_at,
    },
    content: JSON.parse(contentRow?.content || '{}'),
  });
});

// PUT /api/consultant/page — atualizo meu próprio conteúdo
router.put('/page', requireAuth, (req, res) => {
  if (req.user.role !== 'consultant') {
    return res.status(403).json({ error: 'Acesso restrito a consultores.' });
  }
  const consultant = ownConsultant(req);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });

  const content = sanitizeContent(req.body?.content);
  db.prepare(
    'UPDATE consultant_content SET content = ?, updated_at = ? WHERE consultant_id = ?'
  ).run(JSON.stringify(content), nowIso(), consultant.id);

  res.json({ ok: true, content });
});

// PUT /api/consultant/slug — alterar meu slug
router.put('/slug', requireAuth, (req, res) => {
  if (req.user.role !== 'consultant') {
    return res.status(403).json({ error: 'Acesso restrito a consultores.' });
  }
  const consultant = ownConsultant(req);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });

  const requested = String(req.body?.slug || '').trim().toLowerCase();
  const base = genSlug(requested || consultant.display_name);
  if (!base) return res.status(400).json({ error: 'Slug inválido.' });

  let slug = base;
  if (base !== consultant.slug) {
    slug = uniqueSlug(base);
  }
  db.prepare('UPDATE consultants SET slug = ?, updated_at = ? WHERE id = ?').run(
    slug,
    nowIso(),
    consultant.id
  );
  res.json({ ok: true, slug });
});

// GET /api/consultant/leads — leads da minha página
router.get('/leads', requireAuth, (req, res) => {
  if (req.user.role !== 'consultant') {
    return res.status(403).json({ error: 'Acesso restrito a consultores.' });
  }
  const consultant = ownConsultant(req);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });
  const leads = db
    .prepare('SELECT * FROM leads WHERE consultant_id = ? ORDER BY created_at DESC LIMIT 200')
    .all(consultant.id);
  res.json({ leads });
});

// POST /api/consultant/uploads — upload de imagem (logo/foto)
// (arquivos salvos em /uploads e servidos estaticamente)

export default router;

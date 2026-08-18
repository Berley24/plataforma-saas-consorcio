import { Router } from 'express';
import { requireAuth } from '../middleware.js';
import { getProvider, MOCK_PRICE, PLAN } from '../services/payment.js';
import { db } from '../db.js';

const router = Router();

// GET /api/payments/plan — metadados do plano (público, para a página de checkout)
router.get('/plan', (_req, res) => res.json(PLAN));

// GET /api/payments/checkout-info?sub=... — consulta o estado de um checkout em andamento
router.get('/checkout-info', requireAuth, (req, res) => {
  const sub = String(req.query.sub || '');
  if (!sub) return res.status(400).json({ error: 'Falta o identificador da assinatura.' });
  const consultant = db
    .prepare('SELECT * FROM consultants WHERE user_id = ? AND subscription_id = ?')
    .get(req.user.id, sub);
  if (!consultant) return res.status(404).json({ error: 'Checkout não encontrado.' });
  res.json({
    subscriptionId: consultant.subscription_id,
    subscription_status: consultant.subscription_status,
    plan: PLAN,
  });
});

// POST /api/payments/checkout — inicia a assinatura do consultor logado
router.post('/checkout', requireAuth, (req, res) => {
  if (req.user.role !== 'consultant') {
    return res.status(403).json({ error: 'Acesso restrito a consultores.' });
  }
  const consultant = db
    .prepare('SELECT * FROM consultants WHERE user_id = ?')
    .get(req.user.id);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });

  const provider = getProvider();
  provider
    .createCheckout(consultant, consultant.plan)
    .then((data) => res.json({ ...data, price: MOCK_PRICE, provider: process.env.PAYMENT_PROVIDER || 'mock' }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// POST /api/payments/webhook — webhook do provedor (Stripe/MP/mock)
router.post('/webhook', (req, res) => {
  const provider = getProvider();
  provider
    .handleWebhook(req.body, req.headers['stripe-signature'])
    .then((r) => res.json(r.ok ? { received: true } : { error: r.error }))
    .catch((err) => {
      console.error('webhook error', err);
      res.status(500).json({ error: 'Falha ao processar webhook.' });
    });
});

// GET /api/payments/status — status da assinatura atual do consultor logado
router.get('/status', requireAuth, (req, res) => {
  const consultant = db
    .prepare('SELECT * FROM consultants WHERE user_id = ?')
    .get(req.user.id);
  if (!consultant) return res.status(404).json({ error: 'Consultor não encontrado.' });
  res.json({
    subscription_status: consultant.subscription_status,
    plan: consultant.plan,
    current_period_end: consultant.current_period_end,
    active_until: consultant.active_until,
    price: MOCK_PRICE,
  });
});

// GET /api/payments/mock-checkout/:subscriptionId — página de demo do pagamento mock
router.get('/mock-checkout/:subscriptionId', (req, res) => {
  const { subscriptionId } = req.params;
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Assinatura Consorciofy</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 20% 20%,#ffd6d1,transparent 45%),radial-gradient(circle at 80% 30%,#e0c3ff,transparent 45%),linear-gradient(180deg,#fff,#f6f6fb);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1c1c1e;padding:24px;box-sizing:border-box}
  .card{max-width:420px;width:100%;background:rgba(255,255,255,.55);backdrop-filter:blur(24px) saturate(180%);border:1px solid rgba(255,255,255,.8);border-radius:32px;box-shadow:0 1px 0 rgba(255,255,255,.9) inset,0 24px 60px rgba(0,0,0,.12);padding:40px;text-align:center}
  h1{font-size:22px;margin:0 0 8px}
  p{color:#6e6e73;line-height:1.6;margin:0 0 24px;font-size:15px}
  .price{font-size:40px;font-weight:700;letter-spacing:-1px;margin:8px 0 4px}
  .price small{font-size:16px;font-weight:600;color:#6e6e73}
  .btn{display:block;width:100%;border:0;border-radius:999px;padding:16px;font-size:17px;font-weight:700;color:#fff;cursor:pointer;background:linear-gradient(180deg,#ff5a4e,#ff3b30 45%,#e02a1f);box-shadow:0 1px 0 rgba(255,255,255,.4) inset,0 12px 28px rgba(255,59,48,.35);transition:transform .08s ease}
  .btn:active{transform:scale(.97)}
  .note{margin-top:16px;font-size:12px;color:#8e8e93}
  .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#8e8e93}
  .ok{color:#28a745;font-weight:700;font-size:17px}
  .err{color:#ff3b30;font-weight:600}
</style>
</head>
<body>
  <div class="card">
    <h1>Consorciofy</h1>
    <p>Assinatura mensal do seu consultor</p>
    <div class="price">R$ ${MOCK_PRICE}<small>/mês</small></div>
    <p>Este é o ambiente de demonstração (modo mock). Nenhum cartão é cobrado.</p>
    <button class="btn" id="pay">Aprovar pagamento de demonstração</button>
    <p class="note mono" id="status"></p>
  </div>
<script>
const pay = document.getElementById('pay');
const status = document.getElementById('status');
pay.addEventListener('click', async () => {
  pay.disabled = true;
  pay.textContent = 'Processando…';
  try {
    const r = await fetch('/api/payments/mock-checkout/${subscriptionId}/approve', { method: 'POST' });
    const d = await r.json();
    if (d.ok) {
      status.className = 'mono ok';
      status.textContent = 'Pagamento aprovado! Redirecionando…';
      setTimeout(() => location.href = '${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?paid=1', 1200);
    } else {
      status.className = 'mono err';
      status.textContent = d.error || 'Erro ao aprovar.';
      pay.disabled = false; pay.textContent = 'Tentar novamente';
    }
  } catch(e) {
    status.className = 'mono err';
    status.textContent = 'Erro de conexão.';
    pay.disabled = false; pay.textContent = 'Tentar novamente';
  }
});
</script>
</body>
</html>`;
  res.set('Content-Type', 'text/html');
  res.send(html);
});

// POST /api/payments/mock-checkout/:subscriptionId/approve — aprova o mock
router.post('/mock-checkout/:subscriptionId/approve', (req, res) => {
  const { subscriptionId } = req.params;
  const provider = getProvider();
  if ((process.env.PAYMENT_PROVIDER || 'mock') !== 'mock') {
    return res.status(400).json({ error: 'Endpoint disponível apenas no modo mock.' });
  }
  provider
    .approve(subscriptionId)
    .then((r) => res.json(r.ok ? { ok: true } : { ok: false, error: r.error }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

export default router;

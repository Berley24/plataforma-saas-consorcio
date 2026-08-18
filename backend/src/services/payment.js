// Serviço de pagamentos recorrentes.
// Abstraction: providers implement { createCheckout, handleWebhook }.
// Por padrão usamos "mock" (demo sem processamento real de cartão).
// A plataforma NUNCA armazena número de cartão; quem lida com isso é o provedor.

import { db, nowIso } from '../db.js';

const MOCK_PRICE = process.env.MOCK_PRICE || '39.90';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Plano da plataforma (exibido na página de checkout)
export const PLAN = {
  name: process.env.PLAN_NAME || 'Consorciofy Pro',
  price: MOCK_PRICE,
  period: 'mensal',
  tagline: 'Tudo o que você precisa para vender mais.',
  features: [
    'Página pública personalizável (Liquid Glass)',
    'Editor completo de conteúdo',
    'Foto com recorte automático de fundo',
    'Captação e gestão de leads',
    'Status de assinatura no painel',
    'Suporte humano dedicado',
  ],
};

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function setSubscription(consultantId, status, extra = {}) {
  const fields = ['subscription_status = ?'];
  const values = [status];
  if (extra.subscriptionId) {
    fields.push('subscription_id = ?');
    values.push(extra.subscriptionId);
  }
  if (extra.customerId) {
    fields.push('customer_id = ?');
    values.push(extra.customerId);
  }
  if (extra.currentPeriodEnd) {
    fields.push('current_period_end = ?');
    values.push(extra.currentPeriodEnd);
  }
  fields.push('active_until = ?');
  values.push(extra.currentPeriodEnd || null);
  fields.push('updated_at = ?');
  values.push(nowIso());
  values.push(consultantId);
  db.prepare(`UPDATE consultants SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function getStatus(consultant) {
  if (!consultant) return 'none';
  const { subscription_status, blocked_at, active_until, trial_ends_at } = consultant;
  if (subscription_status === 'blocked') return 'blocked';
  const now = Date.now();
  const expire = active_until || trial_ends_at;
  if (expire && new Date(expire).getTime() < now) {
    // ciclo vencido
    if (subscription_status === 'active') return 'past_due';
    return subscription_status;
  }
  return subscription_status;
}

export function isActive(consultant) {
  const s = getStatus(consultant);
  return s === 'active' || s === 'trial';
}

// ---- Provedor MOCK (demo) ----
const mockProvider = {
  async createCheckout(consultant, plan) {
    const subId = `sub_mock_${Date.now()}_${consultant.id}`;
    setSubscription(consultant.id, 'pending', { subscriptionId: subId });
    const checkoutUrl = `/checkout?sub=${subId}`;
    return { checkoutUrl, subscriptionId: subId, price: MOCK_PRICE, provider: 'mock' };
  },

  async approve(subId) {
    const row = db
      .prepare('SELECT * FROM consultants WHERE subscription_id = ?')
      .get(subId);
    if (!row) return { ok: false, error: 'Assinatura não encontrada.' };
    const periodEnd = addDays(30);
    setSubscription(row.id, 'active', {
      subscriptionId: subId,
      currentPeriodEnd: periodEnd,
    });
    return { ok: true, consultant: row.id };
  },

  async handleWebhook(body) {
    // webhook do mock: aceita um JSON { subscription_id, event: 'paid'|'failed' }
    const { subscription_id, event } = body || {};
    const row = db
      .prepare('SELECT * FROM consultants WHERE subscription_id = ?')
      .get(subscription_id);
    if (!row) return { ok: false, error: 'Assinatura não encontrada.' };
    if (event === 'paid') {
      setSubscription(row.id, 'active', { currentPeriodEnd: addDays(30) });
    } else if (event === 'failed') {
      setSubscription(row.id, 'past_due');
    } else if (event === 'cancelled') {
      setSubscription(row.id, 'cancelled');
    }
    return { ok: true };
  },
};

// ---- Provedor Mercado Pago (quando MP_ACCESS_TOKEN estiver definido) ----
const mpProvider = {
  async createCheckout(consultant, plan) {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('Mercado Pago não configurado (falta MP_ACCESS_TOKEN).');
    const body = {
      reason: `Assinatura Consorciofy - ${consultant.display_name}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: Number(MOCK_PRICE),
        currency_id: 'BRL',
      },
      payer_email: process.env.MP_EMAIL || 'cliente@exemplo.com',
      back_url: `${FRONTEND_URL}/dashboard`,
    };
    const res = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao criar assinatura no Mercado Pago.');
    setSubscription(consultant.id, 'pending', {
      subscriptionId: data.id,
      customerId: data.payer_id ? String(data.payer_id) : undefined,
    });
    return { checkoutUrl: data.init_point, subscriptionId: data.id, price: MOCK_PRICE };
  },
  async handleWebhook(body) {
    // Notificações do MP: { action, data: { id } } - verificar no recurso preapproval
    const id = body?.data?.id;
    if (!id) return { ok: false, error: 'Sem id da notificação.' };
    const token = process.env.MP_ACCESS_TOKEN;
    const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const row = db.prepare('SELECT * FROM consultants WHERE subscription_id = ?').get(id);
    if (row && data.status) {
      if (data.status === 'authorized') setSubscription(row.id, 'active', { currentPeriodEnd: addDays(30) });
      else if (data.status === 'paused' || data.status === 'cancelled') setSubscription(row.id, 'cancelled');
    }
    return { ok: true };
  },
};

// ---- Provedor Stripe (quando STRIPE_SECRET_KEY estiver definido) ----
const stripeProvider = {
  async createCheckout(consultant, plan) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Stripe não configurado (falta STRIPE_SECRET_KEY).');
    const price = process.env.STRIPE_PRICE_ID;
    if (!price) throw new Error('Falta STRIPE_PRICE_ID.');
    const form = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': price,
      'line_items[0][quantity]': '1',
      success_url: `${FRONTEND_URL}/dashboard?paid=1`,
      cancel_url: `${FRONTEND_URL}/dashboard?cancel=1`,
      'metadata[consultant_id]': String(consultant.id),
    });
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Erro ao criar checkout no Stripe.');
    setSubscription(consultant.id, 'pending', {
      subscriptionId: data.id,
      customerId: data.customer,
    });
    return { checkoutUrl: data.url, subscriptionId: data.id, price: MOCK_PRICE };
  },
  async handleWebhook(body, signature) {
    // Em produção valide a assinatura do webhook com o SDK do Stripe.
    const type = body?.type;
    const sub = body?.data?.object;
    if (!sub) return { ok: false, error: 'Payload inválido.' };
    const row = db
      .prepare('SELECT * FROM consultants WHERE subscription_id = ?')
      .get(sub.id);
    if (row && type === 'invoice.paid') {
      setSubscription(row.id, 'active', { currentPeriodEnd: addDays(30) });
    } else if (row && type === 'customer.subscription.deleted') {
      setSubscription(row.id, 'cancelled');
    }
    return { ok: true };
  },
};

export function getProvider() {
  const name = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  if (name === 'mercadopago') return mpProvider;
  if (name === 'stripe') return stripeProvider;
  return mockProvider;
}

export { MOCK_PRICE, addDays };

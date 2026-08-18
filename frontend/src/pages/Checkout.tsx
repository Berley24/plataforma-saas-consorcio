import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { CheckoutInfo } from '../lib/api';
import { api, getToken } from '../lib/api';
import { IconCheck, IconLock, IconSparkle, IconShield } from '../lib/icons';
import './checkout.css';

export default function Checkout() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const sub = params.get('sub') || '';
  const [info, setInfo] = useState<CheckoutInfo | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'paying' | 'done' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      nav('/login?next=/checkout');
      return;
    }
    if (!sub) {
      setState('error');
      setError('Nenhuma assinatura em andamento.');
      return;
    }
    api
      .get<CheckoutInfo>(`/api/payments/checkout-info?sub=${encodeURIComponent(sub)}`)
      .then((d) => {
        setInfo(d);
        setState('ready');
      })
      .catch((e) => {
        setState('error');
        setError((e as Error).message);
      });
  }, [sub, nav]);

  const pay = async () => {
    if (!info) return;
    setState('paying');
    try {
      const r = await api.post<{ ok: boolean; error?: string }>(`/api/payments/mock-checkout/${info.subscriptionId}/approve`);
      if (r.ok) {
        setState('done');
        setTimeout(() => nav('/dashboard?paid=1'), 1400);
      } else {
        setState('error');
        setError(r.error || 'Erro ao processar pagamento.');
      }
    } catch (e) {
      setState('error');
      setError((e as Error).message);
    }
  };

  // preço mensal do plano
  const price = parseFloat((info?.plan?.price || '39.90').replace(',', '.')) || 39.9;
  const total = price;

  return (
    <div className="co-page">
      <Link to="/dashboard" className="co-brand">
        <span className="logo-mark">C</span>
        <span>Consorciofy</span>
        <span className="co-brand-sub mono">checkout</span>
      </Link>

      {state === 'loading' && (
        <div className="glass co-card co-center">
          <div className="spinner" />
          <p className="mono">preparando checkout…</p>
        </div>
      )}

      {state === 'error' && (
        <div className="glass co-card co-center">
          <div className="co-err-icon">
            <IconLock size={22} />
          </div>
          <h1>Não foi possível continuar</h1>
          <p className="muted">{error}</p>
          <Link className="btn btn-secondary" to="/dashboard">Voltar ao painel</Link>
        </div>
      )}

      {(state === 'ready' || state === 'paying' || state === 'done') && info && (
        <div className="co-wrap">
          {/* Coluna esquerda: plano + método */}
          <div className="co-main">
            <div className="co-steps">
              <span className="co-step active"><i>1</i> Plano</span>
              <span className="co-step active"><i>2</i> Pagamento</span>
              <span className={`co-step ${state === 'done' ? 'active' : ''}`}><i>3</i> Confirmado</span>
            </div>

            <div className="glass co-card co-plan">
              <div className="co-plan-head">
                <div>
                  <span className="mono">assinatura mensal</span>
                  <h1>{info.plan.name}</h1>
                  <p>{info.plan.tagline}</p>
                </div>
                <div className="co-price">
                  <span className="co-currency">R$</span>
                  <strong>{total.toFixed(2).replace('.', ',')}</strong>
                  <span className="co-period">/mês</span>
                </div>
              </div>
              <ul className="co-features">
                {info.plan.features.map((f, i) => (
                  <li key={i}>
                    <span className="co-fcheck"><IconCheck size={13} /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cartão de crédito estilizado (modo mock) */}
            <div className="co-card-ui">
              <div className="ccard">
                <div className="ccard-top">
                  <span className="ccard-chip" />
                  <span className="ccard-brand">Consorciofy</span>
                </div>
                <div className="ccard-num mono">
                  4242 &nbsp;4242 &nbsp;4242 &nbsp;4242
                </div>
                <div className="ccard-bottom">
                  <span className="mono">ANA COSTA</span>
                  <span className="mono">09/29</span>
                </div>
                <div className="ccard-glow" />
              </div>
              <div className="co-paymethod">
                <div className="co-paymethod-label">
                  <span className="co-method-dot" />
                  <strong>Cartão de crédito</strong>
                </div>
                <span className="co-method-note mono">ambiente de demonstração — nenhuma cobrança real</span>
              </div>
            </div>

            {state === 'done' ? (
              <div className="glass co-card co-done">
                <div className="co-done-icon"><IconCheck size={26} /></div>
                <h2>Pagamento aprovado!</h2>
                <p>Sua página está no ar. Redirecionando…</p>
              </div>
            ) : (
              <button className="btn btn-lg btn-block co-pay" onClick={pay} disabled={state === 'paying'}>
                <IconLock size={16} />
                {state === 'paying' ? 'Processando…' : `Aprovar pagamento de R$ ${total.toFixed(2).replace('.', ',')}`}
              </button>
            )}
          </div>

          {/* Coluna direita: resumo */}
          <aside className="co-aside">
            <div className="glass co-card">
              <span className="mono">resumo</span>
              <div className="co-sum-row">
                <span>{info.plan.name}</span>
                <strong>R$ {price.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div className="co-sum-row muted">
                <span>Recorrência</span>
                <span>mensal</span>
              </div>
              <div className="co-sum-row muted">
                <span>Renovação automática</span>
                <span>sim</span>
              </div>
              <div className="co-sum-total">
                <span>Total hoje</span>
                <strong>R$ {total.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div className="co-secure">
                <IconShield size={16} />
                <span className="small">Pagamento processado com segurança. Seus dados de cartão nunca são armazenados pela plataforma.</span>
              </div>
            </div>
            <div className="glass co-card co-help">
              <IconSparkle size={18} />
              <div>
                <strong>Precisa de ajuda?</strong>
                <p className="small muted">Fale com o suporte da Consorciofy.</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

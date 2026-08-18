import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import type { PageContent, ConsultantSummary, Lead } from '../lib/api';
import { api, setToken, statusLabel, displayDate, whatsappLink } from '../lib/api';
import ImageField from '../components/ImageField';
import {
  IconWhatsapp, IconPlus, IconTrash, IconCheck, IconArrowRight, IconLock,
} from '../lib/icons';
import './dashboard.css';

// ---------- helpers de edição ----------
function Text({ label, value, onChange, mono, area, max }: {
  label: string; value: string; onChange: (v: string) => void; mono?: boolean; area?: boolean; max?: number;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {area ? (
        <textarea className="textarea" maxLength={max ?? 4000} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={`input ${mono ? 'input-mono' : ''}`} maxLength={max ?? 300} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass dash-card">
      <div className="dash-card-head">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="dash-card-body">{children}</div>
    </div>
  );
}

// ---------- página principal ----------
export default function Dashboard() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'geral');
  const [content, setContent] = useState<PageContent | null>(null);
  const [me, setMe] = useState<{ consultant: ConsultantSummary } | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('welcome')) setToast('Bem-vindo! Preencha seus dados e assine para publicar.');
    else if (params.get('paid')) setToast('Pagamento aprovado! Sua página está no ar.');
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [params]);

  useEffect(() => {
    api
      .get<{ consultant: ConsultantSummary; content: PageContent }>('/api/consultant/page')
      .then((d) => {
        setMe({ consultant: d.consultant });
        setContent(d.content);
      })
      .catch(() => {
        setToken(null);
        nav('/login');
      });
  }, [nav]);

  useEffect(() => {
    if (tab === 'leads') {
      api.get<{ leads: Lead[] }>('/api/consultant/leads').then((d) => setLeads(d.leads));
    }
  }, [tab]);

  const set = useCallback((patch: Partial<PageContent> | ((c: PageContent) => Partial<PageContent>)) => {
    setContent((prev) => (prev ? { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) } : prev));
  }, []);

  const save = async () => {
    if (!content) return;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const r = await api.put<{ content: PageContent }>('/api/consultant/page', { content });
      setContent(r.content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = me ? `/c/${me.consultant.slug}` : '/c/';
  const wa = content ? whatsappLink(content.identity.whatsapp, content.identity.whatsappMessage) : '#';
  const status = me?.consultant.subscription_status || 'none';
  const st = statusLabel[status] || statusLabel.none;

  const tabs = useMemo(
    () => [
      { id: 'geral', label: 'Identidade' },
      { id: 'hero', label: 'Hero' },
      { id: 'prova', label: 'Prova social' },
      { id: 'modulos', label: 'Blocos' },
      { id: 'faq', label: 'FAQ' },
      { id: 'contato', label: 'Contato' },
      { id: 'leads', label: 'Leads' },
    ],
    []
  );

  if (!content || !me) return <div className="dash-load">carregando…</div>;

  const statusBad = status === 'none' || status === 'pending';

  return (
    <div className="dash">
      <div className="dash-nav">
        <Link to="/" className="nav-logo">
          <span className="logo-mark">C</span>
          <span>Consorciofy</span>
        </Link>
        <div className="dash-nav-right">
          {!statusBad && (
            <a className="btn btn-sm" href={previewUrl} target="_blank" rel="noreferrer">
              Ver página
              <IconArrowRight size={14} />
            </a>
          )}
          <a className="btn btn-sm btn-secondary" href={wa} target="_blank" rel="noreferrer">
            <IconWhatsapp size={14} />
            WhatsApp
          </a>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setToken(null);
              nav('/');
            }}
          >
            Sair
          </button>
        </div>
      </div>

      <div className="container dash-body">
        {toast && <div className="dash-toast">{toast}</div>}
        {/* Banner de assinatura */}
        <div className={`glass dash-banner ${status === 'blocked' ? 'banner-blocked' : statusBad ? 'banner-pay' : 'banner-ok'}`}>
          {status === 'blocked' ? (
            <>
              <IconLock size={20} />
              <div>
                <strong>Sua página está bloqueada.</strong>
                <p className="small">
                  {me.consultant.blocked_reason || 'Entre em contato com a plataforma para regularizar.'}
                </p>
              </div>
            </>
          ) : statusBad ? (
            <>
              <IconLock size={20} />
              <div>
                <strong>Assine para publicar sua página.</strong>
                <p className="small">Enquanto o pagamento estiver ativo, sua página fica no ar.</p>
              </div>
              <StartCheckout />
            </>
          ) : (
            <>
              <IconCheck size={20} />
              <div>
                <strong>Sua página está no ar.</strong>
                <p className="small">
                  Status: <span className={`status-pill ${st.cls}`}>{st.label}</span>
                  {' · '}
                  {me.consultant.active_until ? `até ${displayDate(me.consultant.active_until)}` : 'renovação recorrente'}
                </p>
              </div>
              <span className={`status-pill ${st.cls}`}>{st.label}</span>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`dash-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="dash-content">
          {tab === 'geral' && (
            <GeralTab content={content} set={set} />
          )}
          {tab === 'hero' && (
            <HeroTab content={content} set={set} />
          )}
          {tab === 'prova' && (
            <ProvaTab content={content} set={set} />
          )}
          {tab === 'modulos' && (
            <ModulosTab content={content} set={set} />
          )}
          {tab === 'faq' && (
            <FaqTab content={content} set={set} />
          )}
          {tab === 'contato' && (
            <ContatoTab content={content} set={set} />
          )}
          {tab === 'leads' && (
            <LeadsTab leads={leads} />
          )}

          {tab !== 'leads' && (
            <div className="dash-save">
              {saved && <span className="dash-saved"><IconCheck size={14} /> Salvo!</span>}
              {error && <span className="dash-err">{error}</span>}
              <button className="btn btn-lg" onClick={save} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StartCheckout() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const start = async () => {
    setLoading(true);
    setErr('');
    try {
      const d = await api.post<{ checkoutUrl: string }>('/api/payments/checkout');
      if (d.checkoutUrl.startsWith('/')) nav(d.checkoutUrl);
      else window.location.href = d.checkoutUrl;
    } catch (e) {
      setErr((e as Error).message);
      setLoading(false);
    }
  };
  return (
    <span className="row">
      <button className="btn btn-sm" onClick={start} disabled={loading}>
        {loading ? 'Redirecionando…' : 'Assinar agora'}
      </button>
      {err && <span className="dash-err small">{err}</span>}
    </span>
  );
}

// ---------- Identidade ----------
function GeralTab({ content, set }: { content: PageContent; set: (p: Partial<PageContent>) => void }) {
  return (
    <Section title="Identidade do consultor" subtitle="Logo, foto e informações principais que aparecem no topo e no cartão de identidade.">
      <div className="grid-2">
        <Text label="Nome da marca" value={content.brandName} onChange={(v) => set({ brandName: v })} max={120} />
        <Text label="Selo / tagline (carimbo)" mono value={content.tagline} onChange={(v) => set({ tagline: v })} max={120} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Logo da sua empresa ou marca pessoal</label>
          <ImageField value={content.logo} onChange={(url) => set({ logo: url })} label="Logo" hint="PNG/SVG transparente fica perfeito. Exibida no topo da sua página." />
        </div>
      </div>
      <div className="grid-2">
        <Text label="Nome completo" value={content.identity.name} onChange={(v) => set({ identity: { ...content.identity, name: v } })} max={120} />
        <Text label="Cargo / função" mono value={content.identity.role} onChange={(v) => set({ identity: { ...content.identity, role: v } })} max={120} />
      </div>
      <div className="grid-2">
        <Text label="Cidade / região" value={content.identity.city} onChange={(v) => set({ identity: { ...content.identity, city: v } })} max={120} />
        <Text label="WhatsApp (com DDI)" mono value={content.identity.whatsapp} onChange={(v) => set({ identity: { ...content.identity, whatsapp: v.replace(/\D/g, '').slice(0, 13) } })} max={13} />
      </div>
      <div className="field">
        <label>Mensagem padrão do WhatsApp</label>
        <Text label="Mensagem padrão do WhatsApp" area value={content.identity.whatsappMessage} onChange={(v) => set({ identity: { ...content.identity, whatsappMessage: v } })} max={300} />
      </div>
      <div className="field">
        <label>Foto de perfil (recorte flutuante)</label>
        <ImageField value={content.identity.photo} onChange={(url) => set({ identity: { ...content.identity, photo: url } })} label="Foto de perfil" cutout hint="PNG com fundo transparente fica perfeito — ou ative o recorte automático para remover o fundo branco." />
      </div>
      <div className="field checkbox">
        <label className="check">
          <input
            type="checkbox"
            checked={content.identity.verified}
            onChange={(e) => set({ identity: { ...content.identity, verified: e.target.checked } })}
          />
          <span>Mostrar selo de verificado</span>
        </label>
      </div>
      <div className="grid-2">
        <Text label="Headline de vendas" area value={content.hero.headline} onChange={(v) => set({ hero: { ...content.hero, headline: v } })} max={160} />
        <Text label="Sub-headline" area value={content.hero.subheadline} onChange={(v) => set({ hero: { ...content.hero, subheadline: v } })} max={300} />
      </div>
      <div className="grid-2">
        <Text label="Texto do botão principal" value={content.hero.cta} onChange={(v) => set({ hero: { ...content.hero, cta: v } })} max={60} />
        <Text label="Texto do botão secundário" value={content.hero.ctaSecondary} onChange={(v) => set({ hero: { ...content.hero, ctaSecondary: v } })} max={60} />
      </div>
    </Section>
  );
}

// ---------- Hero ----------
function HeroTab({ content, set }: { content: PageContent; set: (p: Partial<PageContent>) => void }) {
  return (
    <Section title="Sessão principal (Hero)" subtitle="O primeiro impacto da sua página.">
      <div className="grid-2">
        <Text label="Selo do topo (badge)" mono value={content.hero.badge} onChange={(v) => set({ hero: { ...content.hero, badge: v } })} max={120} />
      </div>
      <div className="grid-2">
        <Text label="Headline" area value={content.hero.headline} onChange={(v) => set({ hero: { ...content.hero, headline: v } })} max={160} />
        <Text label="Sub-headline" area value={content.hero.subheadline} onChange={(v) => set({ hero: { ...content.hero, subheadline: v } })} max={300} />
      </div>
      <div className="grid-2">
        <Text label="Botão principal (CTA)" value={content.hero.cta} onChange={(v) => set({ hero: { ...content.hero, cta: v } })} max={60} />
        <Text label="Botão secundário" value={content.hero.ctaSecondary} onChange={(v) => set({ hero: { ...content.hero, ctaSecondary: v } })} max={60} />
      </div>
    </Section>
  );
}

// ---------- Prova social ----------
function ProvaTab({ content, set }: { content: PageContent; set: (p: Partial<PageContent>) => void }) {
  const trust = content.trust;
  const testis = content.testimonials;
  const setTrust = (i: number, patch: Partial<PageContent['trust'][number]>) => {
    const next = [...trust];
    next[i] = { ...next[i], ...patch };
    set({ trust: next });
  };
  const setT = (i: number, patch: Partial<PageContent['testimonials'][number]>) => {
    const next = [...testis];
    next[i] = { ...next[i], ...patch };
    set({ testimonials: next });
  };
  return (
    <>
      <Section title="Tira de confiança" subtitle="Três blocos curtos com ícones que transmitem credibilidade.">
        {trust.map((t, i) => (
          <div className="glass dash-subrow" key={i}>
            <div className="grid-3">
              <Text label="Ícone" value={t.icon} onChange={(v) => setTrust(i, { icon: v })} max={30} />
              <Text label="Título" value={t.title} onChange={(v) => setTrust(i, { title: v })} max={120} />
              <Text label="Texto" area value={t.text} onChange={(v) => setTrust(i, { text: v })} max={300} />
            </div>
            <button className="icon-btn" onClick={() => set({ trust: trust.filter((_, j) => j !== i) })} title="Remover">
              <IconTrash size={16} />
            </button>
          </div>
        ))}
        <button className="btn btn-sm btn-secondary mt-2" onClick={() => set({ trust: [...trust, { icon: 'shield', title: '', text: '' }] })}>
          <IconPlus size={14} /> Adicionar bloco
        </button>
      </Section>

      <Section title="Depoimentos" subtitle="Prova social — texto e nome do cliente.">
        {testis.map((t, i) => (
          <div className="glass dash-subrow" key={i}>
            <div className="grid-3">
              <Text label="Nome" value={t.name} onChange={(v) => setT(i, { name: v })} max={120} />
              <Text label="Cargo / resultado" mono value={t.role} onChange={(v) => setT(i, { role: v })} max={120} />
              <Text label="Depoimento" area value={t.text} onChange={(v) => setT(i, { text: v })} max={1000} />
            </div>
            <button className="icon-btn" onClick={() => set({ testimonials: testis.filter((_, j) => j !== i) })} title="Remover">
              <IconTrash size={16} />
            </button>
          </div>
        ))}
        <button className="btn btn-sm btn-secondary mt-2" onClick={() => set({ testimonials: [...testis, { name: '', role: '', text: '' }] })}>
          <IconPlus size={14} /> Adicionar depoimento
        </button>
      </Section>
    </>
  );
}

// ---------- Blocos modulares ----------
function ModulosTab({ content, set }: { content: PageContent; set: (p: Partial<PageContent>) => void }) {
  const mods = content.modules;
  const setM = (i: number, patch: Partial<PageContent['modules'][number]>) => {
    const next = [...mods];
    next[i] = { ...next[i], ...patch };
    set({ modules: next });
  };
  return (
    <Section title="Blocos livres (bento grid)" subtitle="Adicione quantas seções quiser: fotos de entregas, certificados, vídeos, selos de parceria.">
      {mods.map((m, i) => (
        <div className="glass dash-subrow" key={i}>
          <div className="field">
            <label>Tipo</label>
            <select className="input" value={m.type} onChange={(e) => setM(i, { type: e.target.value as PageContent['modules'][number]['type'] })}>
              <option value="badge">Selo / destaque</option>
              <option value="photo">Foto</option>
              <option value="video">Vídeo</option>
              <option value="certificate">Certificado</option>
              <option value="partner">Parceria</option>
            </select>
          </div>
          <div className="grid-2">
            <Text label="Título" value={m.title} onChange={(v) => setM(i, { title: v })} max={120} />
            <Text label="Descrição" value={m.text} onChange={(v) => setM(i, { text: v })} max={400} />
          </div>
          {(m.type === 'photo' || m.type === 'video') && (
            <div className="field">
              <label>{m.type === 'video' ? 'URL do vídeo' : 'Imagem'}</label>
              <ImageField value={m.media} onChange={(url) => setM(i, { media: url })} label={m.type === 'video' ? 'Vídeo' : 'Imagem'} />
            </div>
          )}
          <button className="icon-btn" onClick={() => set({ modules: mods.filter((_, j) => j !== i) })} title="Remover">
            <IconTrash size={16} />
          </button>
        </div>
      ))}
      <button
        className="btn btn-sm btn-secondary mt-2"
        onClick={() => set({ modules: [...mods, { type: 'badge', title: '', text: '', media: '' }] })}
      >
        <IconPlus size={14} /> Adicionar bloco
      </button>
    </Section>
  );
}

// ---------- FAQ ----------
function FaqTab({ content, set }: { content: PageContent; set: (p: Partial<PageContent>) => void }) {
  const faq = content.faq;
  const setF = (i: number, patch: Partial<PageContent['faq'][number]>) => {
    const next = [...faq];
    next[i] = { ...next[i], ...patch };
    set({ faq: next });
  };
  return (
    <Section title="Perguntas frequentes" subtitle="Acordeão exibido na sua página.">
      {faq.map((f, i) => (
        <div className="glass dash-subrow" key={i}>
          <div className="grid-2">
            <Text label="Pergunta" value={f.q} onChange={(v) => setF(i, { q: v })} max={300} />
            <Text label="Resposta" area value={f.a} onChange={(v) => setF(i, { a: v })} max={2000} />
          </div>
          <button className="icon-btn" onClick={() => set({ faq: faq.filter((_, j) => j !== i) })} title="Remover">
            <IconTrash size={16} />
          </button>
        </div>
      ))}
      <button className="btn btn-sm btn-secondary mt-2" onClick={() => set({ faq: [...faq, { q: '', a: '' }] })}>
        <IconPlus size={14} /> Adicionar pergunta
      </button>
    </Section>
  );
}

// ---------- Contato ----------
function ContatoTab({ content, set }: { content: PageContent; set: (p: Partial<PageContent>) => void }) {
  return (
    <>
      <Section title="Formulário final" subtitle="O formulário salva o lead no banco e abre seu WhatsApp com mensagem pronta.">
        <div className="grid-3">
          <Text label="Título" value={content.contact.title} onChange={(v) => set({ contact: { ...content.contact, title: v } })} max={120} />
          <Text label="Subtítulo" value={content.contact.subtitle} onChange={(v) => set({ contact: { ...content.contact, subtitle: v } })} max={300} />
          <Text label="Texto do botão" value={content.contact.cta} onChange={(v) => set({ contact: { ...content.contact, cta: v } })} max={60} />
        </div>
        <div className="field">
          <label>Aviso legal do rodapé</label>
          <textarea className="textarea" maxLength={6000} value={content.legal} onChange={(v) => set({ legal: v.target.value })} />
        </div>
      </Section>
      <Section title="Seção 'sobre mim'" subtitle="Sua história pessoal com foto grande recortada.">
        <div className="field">
          <label>Biografia</label>
          <textarea className="textarea" maxLength={6000} value={content.about.bio} onChange={(v) => set({ about: { ...content.about, bio: v.target.value } })} />
        </div>
        <ImageField value={content.about.photo} onChange={(url) => set({ about: { ...content.about, photo: url } })} label="Foto grande (recorte)" cutout />
      </Section>
      <Section title="Comparativo" subtitle="Consórcio x financiamento.">
        <div className="grid-2">
          <div>
            <Text label="Título" value={content.comparison.title} onChange={(v) => set({ comparison: { ...content.comparison, title: v } })} max={120} />
          </div>
          <div>
            <Text label="Subtítulo" value={content.comparison.subtitle} onChange={(v) => set({ comparison: { ...content.comparison, subtitle: v } })} max={300} />
          </div>
        </div>
        <div className="grid-2">
          <div>
            <label className="block-label">Pontos do consórcio</label>
            {content.comparison.consortium.map((p, i) => (
              <div className="row mb-2" key={i}>
                <input className="input" maxLength={120} placeholder="Título" value={p.title} onChange={(e) => { const c = { ...content.comparison }; c.consortium[i] = { ...p, title: e.target.value }; set({ comparison: c }); }} />
                <input className="input" maxLength={400} placeholder="Texto" value={p.text} onChange={(e) => { const c = { ...content.comparison }; c.consortium[i] = { ...p, text: e.target.value }; set({ comparison: c }); }} />
                <button className="icon-btn" onClick={() => set({ comparison: { ...content.comparison, consortium: content.comparison.consortium.filter((_, j) => j !== i) } })}><IconTrash size={16} /></button>
              </div>
            ))}
            <button className="btn btn-sm btn-secondary" onClick={() => set({ comparison: { ...content.comparison, consortium: [...content.comparison.consortium, { title: '', text: '' }] } })}><IconPlus size={14} /> ponto</button>
          </div>
          <div>
            <label className="block-label">Pontos do financiamento</label>
            {content.comparison.financing.map((p, i) => (
              <div className="row mb-2" key={i}>
                <input className="input" maxLength={120} placeholder="Título" value={p.title} onChange={(e) => { const c = { ...content.comparison }; c.financing[i] = { ...p, title: e.target.value }; set({ comparison: c }); }} />
                <input className="input" maxLength={400} placeholder="Texto" value={p.text} onChange={(e) => { const c = { ...content.comparison }; c.financing[i] = { ...p, text: e.target.value }; set({ comparison: c }); }} />
                <button className="icon-btn" onClick={() => set({ comparison: { ...content.comparison, financing: content.comparison.financing.filter((_, j) => j !== i) } })}><IconTrash size={16} /></button>
              </div>
            ))}
            <button className="btn btn-sm btn-secondary" onClick={() => set({ comparison: { ...content.comparison, financing: [...content.comparison.financing, { title: '', text: '' }] } })}><IconPlus size={14} /> ponto</button>
          </div>
        </div>
      </Section>
    </>
  );
}

// ---------- Leads ----------
function LeadsTab({ leads }: { leads: Lead[] }) {
  if (!leads.length) {
    return (
      <Section title="Leads" subtitle="Os contatos enviados pelo formulário da sua página aparecem aqui.">
        <p className="muted">Nenhum lead ainda. Compartilhe sua página!</p>
      </Section>
    );
  }
  return (
    <Section title={`Leads (${leads.length})`} subtitle="Contatos recebidos no formulário da sua página.">
      <div className="table-wrap">
        <table className="glass">
          <thead>
            <tr>
              <th>Nome</th>
              <th>WhatsApp</th>
              <th>E-mail</th>
              <th>Mensagem</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td><strong>{l.name}</strong></td>
                <td className="mono">{l.whatsapp || '—'}</td>
                <td>{l.email || '—'}</td>
                <td className="muted small">{l.message?.slice(0, 60) || '—'}</td>
                <td className="mono">{displayDate(l.created_at)}</td>
                <td>
                  {l.whatsapp && (
                    <a className="btn btn-sm" href={`https://wa.me/${l.whatsapp}?text=${encodeURIComponent('Olá! Sou o(a) consultor(a) que você contatou.')}`} target="_blank" rel="noreferrer">
                      <IconWhatsapp size={13} />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

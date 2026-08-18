import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PageContent, PublicPage } from '../lib/api';
import { api, whatsappLink } from '../lib/api';
import { useReveal, useScrollProgress, useTilt } from '../lib/hooks';
import {
  IconWhatsapp, IconCheck, IconX, IconChevronDown, IconMapPin,
  IconQuote, TrustIcon, ModuleIcon,
} from '../lib/icons';
import './public.css';

// ============ Navbar ============
function PublicNav({ content }: { content: PageContent }) {
  const wa = whatsappLink(content.identity.whatsapp, content.identity.whatsappMessage);
  return (
    <header className="pnav">
      <div className="pnav-inner glass">
        <div className="pnav-brand">
          <span className="logo-mark">{content.brandName.charAt(0).toUpperCase()}</span>
          <span>{content.brandName}</span>
          <span className="pnav-sep">/</span>
          <span className="mono">{content.tagline}</span>
        </div>
        <a className="btn btn-sm" href={wa} target="_blank" rel="noreferrer">
          <IconWhatsapp size={16} />
          WhatsApp
        </a>
      </div>
    </header>
  );
}

// ============ Hero / Cartão de identidade ============
function Hero({ content }: { content: PageContent }) {
  const { identity, hero } = content;
  const wa = whatsappLink(identity.whatsapp, identity.whatsappMessage);
  const tiltRef = useTilt<HTMLDivElement>();
  const scroll = useScrollProgress();

  return (
    <section className="phero">
      <div className="container phero-grid">
        <div className="phero-copy" ref={tiltRef}>
          <div className="mono-chip reveal visible">
            <IconCheck size={12} />
            {hero.badge}
          </div>
          <h1 className="reveal visible delay-1">{hero.headline}</h1>
          <p className="phero-sub reveal visible delay-2">{hero.subheadline}</p>
          <div className="phero-cta reveal visible delay-3">
            <a className="btn btn-lg" href={wa} target="_blank" rel="noreferrer">
              <IconWhatsapp size={18} />
              {hero.cta}
            </a>
            <a className="btn btn-lg btn-secondary" href="#contato">
              {hero.ctaSecondary}
            </a>
          </div>
          <div className="phero-meta mono reveal visible delay-4">
            <span>{identity.city}</span>
            <span className="phero-dot">·</span>
            <span>cred. BCB</span>
          </div>
        </div>

        <div className="phero-card-col reveal visible delay-2">
          <div className="glass phero-card" data-tilt style={{ transformStyle: 'preserve-3d' }}>
            <div className="pcard-glow" />
            <div
              className="cutout-wrap"
              style={{ perspective: 1000, transform: `rotateX(${(-scroll * 6).toFixed(2)}deg) rotateY(${(scroll * 10).toFixed(2)}deg)` }}
            >
              <div className="float-cutout">
                {identity.photo ? (
                  <img
                    className="cutout-img"
                    src={identity.photo}
                    alt={identity.name}
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                  />
                ) : (
                  <div className="cutout-placeholder">
                    <span>{identity.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="pcard-name">
              <h2>
                {identity.name}
                {identity.verified && (
                  <span className="verified-badge" title="Verificado">
                    <IconCheck size={12} />
                  </span>
                )}
              </h2>
              <p className="mono">{identity.role}</p>
              <p className="pcard-city">
                <IconMapPin size={14} />
                {identity.city}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ Tira de confiança ============
function Trust({ content }: { content: PageContent }) {
  const ref = useReveal();
  return (
    <section className="section ptsection" ref={ref}>
      <div className="container">
        <div className="grid-3">
          {content.trust.map((t, i) => (
            <div className="glass card pcard" key={i}>
              <div className="pcard-icon">
                <TrustIcon name={t.icon} />
              </div>
              <h3 className="card-title">{t.title}</h3>
              <p className="card-text">{t.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ Como funciona ============
function HowItWorks({ content }: { content: PageContent }) {
  const ref = useReveal();
  return (
    <section className="section ptsection" ref={ref}>
      <div className="container">
        <div className="section-head">
          <span className="mono">processo</span>
          <h2>Como funciona</h2>
          <p>Três passos simples até a sua carta de crédito.</p>
        </div>
        <div className="grid-3">
          {content.howItWorks.map((s, i) => (
            <div className="glass card pcard pstep" key={i}>
              <div className="pstep-num mono">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="card-title">{s.title}</h3>
              <p className="card-text">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ Comparativo ============
function Comparison({ content }: { content: PageContent }) {
  const ref = useReveal();
  const { comparison } = content;
  return (
    <section className="section ptsection" ref={ref}>
      <div className="container">
        <div className="section-head">
          <span className="mono">comparativo</span>
          <h2>{comparison.title}</h2>
          <p>{comparison.subtitle}</p>
        </div>
        <div className="grid-2">
          <div className="glass glass-red card pcard pcomp pcomp-win">
            <h3 className="pcomp-title">
              <IconCheck size={18} />
              Consórcio
            </h3>
            {comparison.consortium.map((p, i) => (
              <div className="pcomp-row" key={i}>
                <span className="pcomp-check">
                  <IconCheck size={14} />
                </span>
                <div>
                  <strong>{p.title}</strong>
                  <p className="small muted">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="glass card pcard pcomp pcomp-loss">
            <h3 className="pcomp-title muted">
              <IconX size={18} />
              Financiamento
            </h3>
            {comparison.financing.map((p, i) => (
              <div className="pcomp-row" key={i}>
                <span className="pcomp-x">
                  <IconX size={14} />
                </span>
                <div>
                  <strong>{p.title}</strong>
                  <p className="small muted">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ Sobre o consultor ============
function About({ content }: { content: PageContent }) {
  const ref = useReveal();
  const scroll = useScrollProgress();
  return (
    <section className="section ptsection" ref={ref}>
      <div className="container">
        <div className="glass pabout">
          <div className="pabout-photo" data-tilt style={{ perspective: 900 }}>
            {content.about.photo ? (
              <img
                className="float-cutout pabout-img"
                src={content.about.photo}
                alt={content.identity.name}
                style={{ transform: `rotateY(${(scroll * 12).toFixed(2)}deg)` }}
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
              />
            ) : (
              <div className="cutout-placeholder lg" style={{ transform: `rotateY(${(scroll * 12).toFixed(2)}deg)` }}>
                <span>{content.identity.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="pabout-text">
            <span className="mono">sobre {content.identity.name}</span>
            <h2>Sua história também é a minha missão.</h2>
            <p>{content.about.bio}</p>
            <div className="mono-chip mt-2">
              <IconCheck size={12} />
              atendimento de confiança
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ Depoimentos ============
function Testimonials({ content }: { content: PageContent }) {
  const ref = useReveal();
  return (
    <section className="section ptsection" ref={ref}>
      <div className="container">
        <div className="section-head">
          <span className="mono">prova social</span>
          <h2>Quem já realizou, recomenda</h2>
          <p>Relatos reais de quem foi contemplado com o meu acompanhamento.</p>
        </div>
        <div className="ptest-grid">
          {content.testimonials.map((t, i) => (
            <div className={`glass card pcard ptest ${content.testimonials.length % 2 !== 0 && i === content.testimonials.length - 1 ? 'ptest-wide' : ''}`} key={i}>
              <IconQuote size={26} className="ptest-quote" />
              <p className="ptest-text">“{t.text}”</p>
              <div className="ptest-author">
                <div className="ptest-avatar">{t.name.charAt(0).toUpperCase()}</div>
                <div>
                  <strong>{t.name}</strong>
                  <p className="mono">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ Seção modular (bento grid) ============
function Modules({ content }: { content: PageContent }) {
  const ref = useReveal();
  if (!content.modules?.length) return null;
  return (
    <section className="section ptsection" ref={ref}>
      <div className="container">
        <div className="section-head">
          <span className="mono">conquistas &amp; parcerias</span>
          <h2>Mais sobre o meu trabalho</h2>
        </div>
        <div className="pbento">
          {content.modules.map((m, i) => (
            <div className={`glass card pcard pmodule pmodule-${m.type}`} key={i}>
              <div className="pmodule-icon">
                <ModuleIcon type={m.type} />
              </div>
              {m.media && m.type !== 'video' ? (
                <img className="pmodule-media" src={m.media} alt={m.title} />
              ) : null}
              {m.media && m.type === 'video' ? (
                <video className="pmodule-media" src={m.media} controls muted playsInline />
              ) : null}
              <h3 className="card-title">{m.title}</h3>
              <p className="card-text">{m.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ FAQ ============
function Faq({ content }: { content: PageContent }) {
  const ref = useReveal();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section ptsection" ref={ref}>
      <div className="container">
        <div className="section-head">
          <span className="mono">dúvidas</span>
          <h2>Perguntas frequentes</h2>
        </div>
        <div className="pfaq">
          {content.faq.map((f, i) => (
            <div className={`glass pfaq-item ${open === i ? 'open' : ''}`} key={i}>
              <button className="pfaq-q" onClick={() => setOpen(open === i ? null : i)}>
                <span>{f.q}</span>
                <IconChevronDown size={20} />
              </button>
              <div className="pfaq-a">
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ Formulário de contato ============
function Contact({ content, slug }: { content: PageContent; slug: string }) {
  const ref = useReveal();
  const [form, setForm] = useState({ name: '', whatsapp: '', email: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      await api.post(`/api/public/${slug}/lead`, form);
      setState('sent');
      // abre o WhatsApp com mensagem pronta
      const msg = `Olá! Sou ${form.name || 'um visitante'}${form.message ? ` — ${form.message}` : ''}. Vim pela sua página.`;
      window.open(whatsappLink(content.identity.whatsapp, msg), '_blank');
    } catch (err) {
      setState('error');
      setError((err as Error).message || 'Erro ao enviar.');
    }
  };

  return (
    <section className="section ptsection pcontact" id="contato" ref={ref}>
      <div className="container">
        <div className="glass glass-red pcontact-card">
          <div className="pcontact-copy">
            <span className="mono">contato</span>
            <h2>{content.contact.title}</h2>
            <p>{content.contact.subtitle}</p>
          </div>
          <div className="pcontact-form">
            {state === 'sent' ? (
              <div className="pcontact-done">
                <div className="verified-badge lg">
                  <IconCheck size={18} />
                </div>
                <h3>Recebido!</h3>
                <p>Abri o WhatsApp para continuarmos a conversa.</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="field">
                  <label>Nome</label>
                  <input
                    className="input"
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>WhatsApp</label>
                    <input
                      className="input"
                      inputMode="tel"
                      maxLength={13}
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="field">
                    <label>E-mail</label>
                    <input
                      className="input"
                      type="email"
                      maxLength={160}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="voce@email.com"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Como posso ajudar?</label>
                  <textarea
                    className="textarea"
                    maxLength={2000}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Quero simular um consórcio de…"
                  />
                </div>
                {error && <p className="pform-error">{error}</p>}
                <button className="btn btn-lg btn-block" disabled={state === 'sending'}>
                  <IconWhatsapp size={18} />
                  {state === 'sending' ? 'Enviando…' : content.contact.cta}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ Rodapé ============
function PublicFooter({ content }: { content: PageContent }) {
  return (
    <footer className="pfooter">
      <div className="container">
        <div className="glass pfooter-card">
          <div className="pfooter-brand">
            <span className="logo-mark">{content.brandName.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{content.brandName}</strong>
              <p className="mono">{content.identity.role}</p>
            </div>
          </div>
          <p className="pfooter-legal small">{content.legal}</p>
        </div>
      </div>
    </footer>
  );
}

// ============ Página indisponível ============
function Unavailable() {
  return (
    <div className="container punavail">
      <div className="glass punavail-card">
        <div className="punavail-icon">
          <IconX size={26} />
        </div>
        <h1>Página indisponível</h1>
        <p>
          Esta página está temporariamente fora do ar. Entre em contato com o consultor por outro canal
          para mais informações.
        </p>
        <Link className="btn btn-secondary" to="/">
          Ir para o início
        </Link>
      </div>
    </div>
  );
}

// ============ Página principal ============
export default function PublicConsultant() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicPage | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setUnavailable(false);
    setData(null);
    api
      .get<PublicPage>(`/api/public/${slug}`)
      .then(setData)
      .catch((err) => {
        if ((err as Error & { status?: number }).status === 403) setUnavailable(true);
        else setUnavailable(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container pcenter">
        <div className="glass pcenter-card">
          <div className="spinner" />
          <p className="mono">carregando…</p>
        </div>
      </div>
    );
  }

  if (unavailable || !data) return <Unavailable />;

  const { content } = data;
  return (
    <>
      <PublicNav content={content} />
      <main>
        <Hero content={content} />
        <Trust content={content} />
        <HowItWorks content={content} />
        <Comparison content={content} />
        <About content={content} />
        <Testimonials content={content} />
        <Modules content={content} />
        <Faq content={content} />
        <Contact content={content} slug={slug as string} />
      </main>
      <PublicFooter content={content} />
    </>
  );
}

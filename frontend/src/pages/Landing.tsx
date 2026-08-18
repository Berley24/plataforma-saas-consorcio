import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../lib/hooks';
import {
  IconCheck, IconWhatsapp, IconShield, IconRocket, IconMedal, IconBolt,
  IconSparkle, IconArrowRight, IconChevronDown, IconUsers, IconChart,
  IconCard, IconCamera,
} from '../lib/icons';
import './landing.css';

const NAV_LINKS = [
  { href: '#recursos', label: 'Recursos' },
  { href: '#como', label: 'Como funciona' },
  { href: '#depoimentos', label: 'Depoimentos' },
  { href: '#precos', label: 'Preços' },
  { href: '#faq', label: 'FAQ' },
];

function Nav() {
  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        <span className="logo-mark">C</span>
        <span>Consorciofy</span>
      </Link>
      <div className="nav-links">
        <div className="nav-links-pills">
          {NAV_LINKS.map((l) => (
            <a key={l.href} className="btn btn-sm btn-ghost" href={l.href}>{l.label}</a>
          ))}
        </div>
        <Link className="btn btn-sm btn-secondary" to="/login">
          Entrar
        </Link>
        <Link className="btn btn-sm" to="/register">
          Criar minha página
          <IconArrowRight size={14} />
        </Link>
      </div>
    </nav>
  );
}

export default function Landing() {
  const ref = useReveal();
  return (
    <>
      <Nav />
      <main ref={ref}>
        {/* Hero */}
        <section className="lhero">
          <div className="container lhero-grid">
            <div className="lhero-copy">
              <div className="mono-chip reveal visible">
                <IconSparkle size={12} />
                Liquid Glass para consultores
              </div>
              <h1 className="reveal visible delay-1">
                Sua página de vendas <br />
                <span className="lgrad">no futuro.</span>
              </h1>
              <p className="lhero-sub reveal visible delay-2">
                Landing pages prontas, personalizáveis e com cara de produto premium
                para consultores de consórcio. Você paga mensal e ganha autoridade
                digital — sem saber programar.
              </p>
              <div className="lhero-cta reveal visible delay-3">
                <Link className="btn btn-lg" to="/register">
                  Criar minha página
                  <IconArrowRight size={18} />
                </Link>
                <a className="btn btn-lg btn-secondary" href="#como">
                  <IconBolt size={17} />
                  Ver como funciona
                </a>
              </div>
              <div className="lhero-trust reveal visible delay-3">
                {['PIX', 'Boleto', 'Cartão'].map((t) => (
                  <span key={t} className="lhero-trust-item">
                    <IconCheck size={13} /> {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="lhero-visual reveal visible delay-3">
              <HeroMock />
            </div>
          </div>
        </section>

        {/* Marquee de credibilidade */}
        <section className="lmarquee-wrap" aria-hidden="true">
          <div className="lmarquee">
            {[0, 1].map((k) => (
              <div className="lmarquee-track" key={k}>
                {['Consórcio regulado', 'BCB', 'ANBIMA', 'Sem juros', 'PIX', 'Boleto', 'Cartão', 'Renovação automática'].map((t, i) => (
                  <span className="lmarquee-item mono" key={i}>{t}</span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Recursos — bento grid */}
        <section className="section" id="recursos">
          <div className="container">
            <div className="section-head reveal">
              <span className="mono">o pacote completo</span>
              <h2>Tudo o que você precisa para vender mais</h2>
              <p>Cada assinatura inclui página pública, gestão de conteúdo e captação de leads.</p>
            </div>
            <div className="bento">
              <div className="glass card bento-card bento-wide reveal">
                <div className="bento-icon">
                  <IconShield size={24} />
                </div>
                <h3 className="card-title">Página no ar 24/7</h3>
                <p className="card-text">
                  Link único do tipo consorciofy.com/seu-nome para compartilhar em
                  redes sociais, WhatsApp e cartões de visita.
                </p>
                <div className="bento-mini-url mono">
                  <span className="logo-mark sm">C</span>
                  consorciofy.com/ana-costa
                  <span className="bento-pill">no ar</span>
                </div>
              </div>
              <div className="glass card bento-card reveal delay-1">
                <div className="bento-icon">
                  <IconRocket size={24} />
                </div>
                <h3 className="card-title">Editor visual</h3>
                <p className="card-text">
                  Edite logo, foto, depoimentos, blocos e textos pelo painel — sem depender de ninguém.
                </p>
                <div className="bento-mini-chips">
                  <span className="mono-chip">logo</span>
                  <span className="mono-chip">foto</span>
                  <span className="mono-chip">textos</span>
                </div>
              </div>
              <div className="glass card bento-card reveal">
                <div className="bento-icon">
                  <IconCamera size={24} />
                </div>
                <h3 className="card-title">Foto recortada</h3>
                <p className="card-text">Recorte automático de fundo que deixa sua foto flutuando sobre o vidro.</p>
              </div>
              <div className="glass card bento-card reveal delay-1">
                <div className="bento-icon">
                  <IconMedal size={24} />
                </div>
                <h3 className="card-title">Captação de leads</h3>
                <p className="card-text">Formulários que salvam contatos no banco e abrem seu WhatsApp na hora.</p>
              </div>
              <div className="glass card bento-card reveal delay-2">
                <div className="bento-icon">
                  <IconChart size={24} />
                </div>
                <h3 className="card-title">Gestão de assinatura</h3>
                <p className="card-text">Status claro no painel, renovação mensal e suporte humano.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="section" id="como">
          <div className="container">
            <div className="section-head reveal">
              <span className="mono">simples</span>
              <h2>Comece em 3 passos</h2>
              <p>Do cadastro ao ar em menos de 10 minutos.</p>
            </div>
            <div className="steps">
              {[
                { n: '01', t: 'Cadastre-se', d: 'Crie sua conta em menos de um minuto e escolha seu nome de página.', icon: <IconUsers size={20} /> },
                { n: '02', t: 'Personalize', d: 'Adicione sua foto recortada, logo, história, depoimentos e blocos.', icon: <IconSparkle size={20} /> },
                { n: '03', t: 'Compartilhe', d: 'Receba leads no painel e no WhatsApp. Simples assim.', icon: <IconWhatsapp size={20} /> },
              ].map((s, i) => (
                <div className={`glass card step reveal delay-${i}`} key={i}>
                  <div className="step-top">
                    <div className="step-icon">{s.icon}</div>
                    <span className="step-num mono">{s.n}</span>
                  </div>
                  <h3 className="card-title">{s.t}</h3>
                  <p className="card-text">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Depoimentos */}
        <section className="section" id="depoimentos">
          <div className="container">
            <div className="section-head reveal">
              <span className="mono">prova social</span>
              <h2>Quem usa, recomenda</h2>
              <p>Consultores que já publicaram a página com a Consorciofy.</p>
            </div>
            <div className="grid-3">
              {[
                { n: 'Ana Costa', r: 'Consultora · SP', t: 'Em uma semana minha página já tinha cara de marca grande. Clientes me chamam pelo WhatsApp direto do site.' },
                { n: 'Carlos Mendes', r: 'Consultor · MG', t: 'O formulário de lead virou meu melhor vendedor. Deixei de perder contato porque tudo cai no painel.' },
                { n: 'Juliana Rocha', r: 'Consultora · BA', t: 'A foto recortada flutuando no vidro impressiona. As pessoas acham que contratei uma agência inteira.' },
              ].map((t, i) => (
                <div className={`glass card testi reveal delay-${i}`} key={i}>
                  <div className="testi-quote">
                    <IconCard size={16} />
                  </div>
                  <p className="testi-text">“{t.t}”</p>
                  <div className="testi-author">
                    <span className="testi-avatar">{t.n.charAt(0)}</span>
                    <div>
                      <strong>{t.n}</strong>
                      <span className="mono">{t.r}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Preços */}
        <section className="section" id="precos">
          <div className="container">
            <div className="section-head reveal">
              <span className="mono">preço</span>
              <h2>Um plano. Sem surpresa.</h2>
              <p>Tudo incluso, sem taxa escondida.</p>
            </div>
            <div className="lprice-wrap reveal">
              <div className="glass glass-red lprice">
                <div className="lprice-top">
                  <div className="lprice-badge mono">assinatura mensal</div>
                  <span className="lprice-trial mono">7 dias grátis</span>
                </div>
                <div className="lprice-value">
                  R$ <strong>39</strong><small>,90</small><span>/mês</span>
                </div>
                <ul className="lprice-list">
                  {[
                    'Página pública personalizável',
                    'Editor de conteúdo completo',
                    'Foto com recorte automático de fundo',
                    'Captação e gestão de leads',
                    'Status de assinatura no painel',
                    'Suporte humano dedicado',
                  ].map((it, i) => (
                    <li key={i}><IconCheck size={16} /> {it}</li>
                  ))}
                </ul>
                <Link className="btn btn-lg btn-block" to="/register">
                  Assinar agora
                  <IconArrowRight size={18} />
                </Link>
                <p className="lprice-note small">
                  Cancele quando quiser. Sem multa, sem burocracia.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq">
          <div className="container">
            <div className="section-head reveal">
              <span className="mono">dúvidas</span>
              <h2>Perguntas frequentes</h2>
            </div>
            <div className="faq reveal">
              {[
                { q: 'Preciso saber programar?', a: 'Não. Tudo é editado pelo painel visual: logo, foto, textos, depoimentos e blocos. Você só preenche e publica.' },
                { q: 'Como funciona o pagamento?', a: 'Você assina mensalmente pelo checkout seguro. O valor é cobrado a cada mês e você pode cancelar quando quiser.' },
                { q: 'O que acontece se eu cancelar?', a: 'Sua página continua no ar até o fim do período pago. Depois disso, ela fica indisponível até a renovação.' },
                { q: 'Os dados dos meus clientes ficam seguros?', a: 'Sim. Os contatos dos formulários ficam no seu painel e no seu WhatsApp. A plataforma tem backups automáticos diários.' },
                { q: 'Posso usar meu próprio domínio?', a: 'Por enquanto o link é consorciofy.com/seu-nome. Domínio próprio está no roadmap.' },
              ].map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="section" id="cta">
          <div className="container text-center">
            <div className="glass lcta reveal">
              <IconBolt size={34} className="lcta-bolt" />
              <h2>Pronto para vender mais?</h2>
              <p>Crie sua página agora e compartilhe em 10 minutos.</p>
              <Link className="btn btn-lg mt-2" to="/register">
                Criar minha página
                <IconArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="lfooter">
          <div className="container">
            <div className="lfooter-grid">
              <div className="lfooter-brand">
                <Link to="/" className="nav-logo">
                  <span className="logo-mark">C</span>
                  <span>Consorciofy</span>
                </Link>
                <p className="small">
                  Páginas Liquid Glass para consultores de consórcio venderem mais.
                </p>
              </div>
              <div className="lfooter-col">
                <span className="mono">plataforma</span>
                <a href="#recursos">Recursos</a>
                <a href="#como">Como funciona</a>
                <a href="#precos">Preços</a>
              </div>
              <div className="lfooter-col">
                <span className="mono">conta</span>
                <Link to="/login">Entrar</Link>
                <Link to="/register">Criar página</Link>
                <Link to="/admin">Admin</Link>
              </div>
            </div>
            <div className="lfooter-bottom mono">
              <span>consorciofy © 2026</span>
              <span>landing pages · liquid glass</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`glass faq-item ${open ? 'open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>{q}</span>
        <IconChevronDown size={18} />
      </button>
      <div className="faq-a">
        <p className="card-text">{a}</p>
      </div>
    </div>
  );
}

function HeroMock() {
  return (
    <div className="lhero-visual-inner" aria-hidden="true">
      <div className="lmock glow">
        <div className="glass lmock-window">
          <div className="lmock-bar">
            <span className="lmock-dots"><i /><i /><i /></span>
            <span className="mono">consorciofy.com/ana-costa</span>
            <span className="btn btn-sm">WhatsApp</span>
          </div>
          <div className="lmock-body">
            <div className="lmock-card">
              <div className="lmock-card-inner">
                <div className="lmock-photo" />
                <div className="lmock-copy">
                  <div className="lmock-line w40" />
                  <div className="lmock-line w90" />
                  <div className="lmock-line w70" />
                  <div className="lmock-pill">falar no whatsapp</div>
                </div>
              </div>
              <div className="lmock-thumbs">
                <div className="lmock-thumb" />
                <div className="lmock-thumb" />
                <div className="lmock-thumb" />
              </div>
            </div>
          </div>
        </div>
        <div className="lfloat-chip c1 mono">página no ar 24/7</div>
        <div className="lfloat-chip c2">
          <span className="lfloat-num">+120</span>
          <span className="lfloat-label">leads no mês</span>
        </div>
        <div className="lfloat-chip c3 mono">sem juros</div>
      </div>
    </div>
  );
}

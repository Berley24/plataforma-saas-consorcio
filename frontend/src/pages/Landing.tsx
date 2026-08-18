import { Link } from 'react-router-dom';
import { useReveal } from '../lib/hooks';
import { IconCheck, IconWhatsapp, IconShield, IconRocket, IconMedal, IconBolt, IconSparkle, IconArrowRight } from '../lib/icons';
import './landing.css';

function Nav() {
  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        <span className="logo-mark">C</span>
        Consorciofy
      </Link>
      <div className="nav-links">
        <a className="btn btn-sm btn-secondary" href="#recursos">Recursos</a>
        <a className="btn btn-sm btn-secondary" href="#precos">Preços</a>
        <Link className="btn btn-sm" to="/login">
          <IconWhatsapp size={15} />
          Entrar
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
          <div className="container text-center">
            <div className="mono-chip reveal visible">
              <IconSparkle size={12} />
              Liquid Glass para consultores
            </div>
            <h1 className="reveal visible delay-1">
              Sua página de vendas <br />
              <span className="lgrad">no futuro.</span>
            </h1>
            <p className="lhero-sub reveal visible delay-2">
              Landing pages prontas, personalizáveis e com cara de produto premium para consultores
              de consórcio. Você paga mensal e ganha autoridade digital — sem saber programar.
            </p>
            <div className="lhero-cta reveal visible delay-3">
              <Link className="btn btn-lg" to="/register">
                Criar minha página
                <IconArrowRight size={18} />
              </Link>
              <a className="btn btn-lg btn-secondary" href="#recursos">Ver recursos</a>
            </div>
            <div className="lhero-mock reveal visible delay-4">
              <MockPreview />
            </div>
            <div className="lcred reveal visible delay-4">
              {['BCB', 'ANBIMA', 'Sem juros', 'PIX', 'Boleto'].map((t) => (
                <span className="lcred-item mono" key={t}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="section" id="recursos">
          <div className="container">
            <div className="section-head">
              <span className="mono">o pacote completo</span>
              <h2>Tudo o que você precisa para vender mais</h2>
              <p>Cada assinatura inclui página pública, gestão de conteúdo e captação de leads.</p>
            </div>
            <div className="grid-3">
              {[
                { icon: <IconShield size={24} />, t: 'Página no ar 24/7', d: 'Link único do tipo consorciofy.com/seu-nome para compartilhar em redes sociais e WhatsApp.' },
                { icon: <IconRocket size={24} />, t: 'Editor visual', d: 'Edite logo, foto, depoimentos, blocos e textos pelo painel — sem depender de ninguém.' },
                { icon: <IconMedal size={24} />, t: 'Captação de leads', d: 'Formulários que salvam contatos no banco e abrem seu WhatsApp na hora.' },
              ].map((f, i) => (
                <div className="glass card lfeature reveal" key={i}>
                  <div className="lfeature-icon">{f.icon}</div>
                  <h3 className="card-title">{f.t}</h3>
                  <p className="card-text">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="section" id="como">
          <div className="container">
            <div className="section-head">
              <span className="mono">simples</span>
              <h2>Comece em 3 passos</h2>
            </div>
            <div className="grid-3">
              {[
                { n: '01', t: 'Cadastre-se', d: 'Crie sua conta em menos de um minuto e escolha seu nome de página.' },
                { n: '02', t: 'Personalize', d: 'Adicione sua foto recortada, logo, história, depoimentos e blocos.' },
                { n: '03', t: 'Compartilhe', d: 'Receba leads no painel e no WhatsApp. Simples assim.' },
              ].map((s, i) => (
                <div className="glass card lstep reveal delay-' + i + '" key={i}>
                  <div className="lstep-num mono">{s.n}</div>
                  <h3 className="card-title">{s.t}</h3>
                  <p className="card-text">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Preços */}
        <section className="section" id="precos">
          <div className="container">
            <div className="section-head">
              <span className="mono">preço</span>
              <h2>Um plano. Sem surpresa.</h2>
            </div>
            <div className="lprice-wrap">
              <div className="glass glass-red lprice reveal">
                <div className="lprice-badge mono">assinatura mensal</div>
                <div className="lprice-value">
                  R$ <strong>39</strong><small>,90</small><span>/mês</span>
                </div>
                <ul className="lprice-list">
                  {['Página pública personalizável', 'Editor de conteúdo completo', 'Captação e gestão de leads', 'Status de assinatura no painel', 'Suporte humano'].map((it, i) => (
                    <li key={i}><IconCheck size={16} /> {it}</li>
                  ))}
                </ul>
                <Link className="btn btn-lg btn-block" to="/register">
                  Assinar agora
                  <IconArrowRight size={18} />
                </Link>
              </div>
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

        <footer className="lfooter mono">
          <div className="container row-between">
            <span>consorciofy © 2026</span>
            <span>landing pages · liquid glass</span>
          </div>
        </footer>
      </main>
    </>
  );
}

function MockPreview() {
  return (
    <div className="lmock" aria-hidden="true">
      <div className="glass lmock-bar">
        <span className="logo-mark sm">C</span>
        <span className="mono">consorciofy.com/ana-costa</span>
        <span className="btn btn-sm">WhatsApp</span>
      </div>
      <div className="glass lmock-card">
        <div className="lmock-card-inner">
          <div className="lmock-photo" />
          <div className="lmock-copy">
            <div className="lmock-line w70" />
            <div className="lmock-line w90" />
            <div className="lmock-line w60" />
            <div className="lmock-pill">falar no whatsapp</div>
          </div>
        </div>
        <div className="lmock-thumbs">
          <div className="lmock-thumb" />
          <div className="lmock-thumb" />
          <div className="lmock-thumb" />
        </div>
      </div>
      <div className="glass lmock-chip">sem juros</div>
    </div>
  );
}

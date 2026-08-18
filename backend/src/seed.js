// Seed: cria admin e um consultor demo.
import { db, nowIso, uniqueSlug, genSlug } from './db.js';
import { createUser, hashPassword, defaultContent, findUserByEmail } from './auth.js';

function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@consorciofy.com';
  const password = process.env.ADMIN_PASSWORD || 'admin12345';
  let admin = findUserByEmail(email);
  if (admin) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', admin.id);
    console.log('Admin já existia:', email);
    return;
  }
  const now = nowIso();
  db.prepare(
    "INSERT INTO users (email, password_hash, role, created_at, updated_at) VALUES (?, ?, 'admin', ?, ?)"
  ).run(email, hashPassword(password), now, now);
  console.log('Admin criado:', email, '| senha:', password);
}

function ensureDemoConsultant() {
  const email = 'demo@consultor.com.br';
  if (findUserByEmail(email)) {
    console.log('Consultor demo já existia.');
    return;
  }
  const slug = uniqueSlug(genSlug('Ana Costa'));
  const { userId, consultantId } = createUser({
    email,
    password: 'demo12345',
    name: 'Ana Costa',
    slug,
  });
  // ativa com trial para a página demo ficar no ar
  const period = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  db.prepare(
    `UPDATE consultants SET subscription_status = 'trial', trial_ends_at = ?, active_until = ?, display_name = ? WHERE id = ?`
  ).run(period, period, 'Ana Costa', consultantId);

  const content = defaultContent();
  content.brandName = 'Consórcio Ana Costa';
  content.hero.headline = 'Realize seu sonho com consórcio seguro e planejado';
  content.hero.subheadline =
    'Atendimento humanizado, condições transparentes e acompanhamento completo do seu grupo.';
  content.identity.name = 'Ana Costa';
  content.identity.role = 'Consultora de Consórcio';
  content.identity.city = 'São Paulo / SP';
  content.identity.whatsapp = '5511999999999';
  content.about.bio =
    'Consultora de consórcio há mais de 10 anos, especializada em imóveis e veículos. Minha missão é transformar o consórcio em um caminho claro e acessível para conquistar seus objetivos, sempre com ética e transparência.';
  content.testimonials = [
    {
      name: 'Mariana S.',
      role: 'Contemplada em 14 meses',
      text: 'Consegui o apartamento dos sonhos sem pagar juros. A Ana me acompanhou em cada etapa do processo. Recomendo demais!',
    },
    {
      name: 'Carlos E.',
      role: 'Contemplado por lance',
      text: 'Fui contemplado em apenas 6 meses dando um lance. O planejamento que a Ana fez foi fundamental.',
    },
    {
      name: 'Fernanda L.',
      role: 'Contemplada em 20 meses',
      text: 'Atendimento impecável, tudo explicado com clareza e sem enrolação. Profissional nota 10.',
    },
  ];
  content.modules = [
    { type: 'badge', title: 'Credenciada', text: 'Atuação autorizada junto às maiores administradoras do país.' },
    { type: 'badge', title: 'Mais de 500 clientes', text: 'Experiência de centenas de consórcios contratados.' },
    { type: 'certificate', title: 'Especialista em consórcios', text: 'Certificada pelas principais administradoras do mercado.' },
  ];
  db.prepare('UPDATE consultant_content SET content = ? WHERE consultant_id = ?').run(
    JSON.stringify(content),
    consultantId
  );
  console.log('Consultor demo criado:', email, '| slug:', slug, '| senha: demo12345');
}

ensureAdmin();
ensureDemoConsultant();
console.log('Seed concluído.');

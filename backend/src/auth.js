import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, nowIso } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-consorciofy';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Cria usuário + registro de consultor em transação.
export function createUser({ email, password, name, slug }) {
  const passwordHash = hashPassword(password);
  const now = nowIso();
  const insertUser = db.prepare(
    `INSERT INTO users (email, password_hash, role, created_at, updated_at)
     VALUES (?, ?, 'consultant', ?, ?)`
  );
  const result = insertUser.run(email.toLowerCase(), passwordHash, now, now);
  const userId = Number(result.lastInsertRowid);
  const insertConsultant = db.prepare(
    `INSERT INTO consultants (user_id, slug, display_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  const c = insertConsultant.run(userId, slug, name, now, now);
  const consultantId = Number(c.lastInsertRowid);
  db.prepare(
    `INSERT INTO consultant_content (consultant_id, content, updated_at) VALUES (?, ?, ?)`
  ).run(consultantId, JSON.stringify(defaultContent()), now);
  return { userId, consultantId };
}

export function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
}

export function findConsultantByUserId(userId) {
  return db.prepare('SELECT * FROM consultants WHERE user_id = ?').get(userId);
}

export function getConsultantWithUser(consultantId) {
  return db
    .prepare(
      `SELECT c.*, u.email FROM consultants c JOIN users u ON u.id = c.user_id WHERE c.id = ?`
    )
    .get(consultantId);
}

// Conteúdo padrão de uma página de consultor (referência visual do Liquid Glass).
export function defaultContent() {
  return {
    brandName: 'Meu Consórcio',
    tagline: 'consórcio com transparência',
    hero: {
      badge: 'Consultor credenciado',
      headline: 'Realize seu próximo sonho com consórcio seguro e planejado',
      subheadline:
        'Planejamento personalizado, condições transparentes e acompanhamento de ponta a ponta.',
      cta: 'Falar no WhatsApp',
      ctaSecondary: 'Simular agora',
    },
    identity: {
      photo: '',
      verified: true,
      name: 'Consultor',
      role: 'Consultor de Consórcio',
      city: 'São Paulo / SP',
      whatsapp: '5511999999999',
      whatsappMessage: 'Olá! Vim pela sua página e quero saber mais sobre consórcio.',
    },
    trust: [
      { icon: 'shield', title: 'Credenciado', text: 'Venda autorizada por administradora regulada pelo Banco Central.' },
      { icon: 'rocket', title: 'Sem juros', text: 'Consórcio não cobra juros, apenas taxa de administração.' },
      { icon: 'medal', title: 'Acompanhamento', text: 'Suporte dedicado em todo o ciclo do grupo.' },
    ],
    howItWorks: [
      { title: 'Simulação', text: 'Você define o bem, o valor e o prazo que cabem no seu bolso.' },
      { title: 'Carta de crédito', text: 'Você recebe a carta para comprar à vista, sem burocracia.' },
      { title: 'Contemplação', text: 'Concorre todos os meses e ainda pode dar lance para antecipar.' },
    ],
    comparison: {
      title: 'Consórcio x Financiamento',
      subtitle: 'Veja por que o consórcio pode ser a escolha mais inteligente.',
      consortium: [
        { title: 'Sem juros', text: 'Paga apenas taxa de administração e fundo de reserva.' },
        { title: 'Sem entrada pesada', text: 'Parcelas mensais e programadas, sem entrada obrigatória.' },
        { title: 'Poder de compra à vista', text: 'Recebe carta de crédito para negociar à vista.' },
      ],
      financing: [
        { title: 'Juros compostos', text: 'Os juros elevam significativamente o custo final.' },
        { title: 'Entrada alta', text: 'Geralmente exige entrada de 20% a 50% do bem.' },
        { title: 'Parcelas fixas altas', text: 'Prestações maiores que encarecem o planejamento.' },
      ],
    },
    about: {
      photo: '',
      bio:
        'Com anos de experiência no mercado de consórcios, meu propósito é ajudar você a conquistar o bem dos seus sonhos com segurança, planejamento e total transparência.',
    },
    testimonials: [
      {
        name: 'Mariana S.',
        role: 'Contemplada em 14 meses',
        text: 'Consegui meu carro novo e ainda economizei muito em relação ao financiamento. Atendimento excelente do início ao fim.',
      },
      {
        name: 'Carlos E.',
        role: 'Contemplado por lance',
        text: 'O consultor me orientou no lance e fui contemplado no segundo mês. Recomendo demais!',
      },
    ],
    modules: [
      {
        type: 'badge',
        title: 'Credenciado',
        text: 'Atuação autorizada junto às maiores administradoras do país.',
      },
      {
        type: 'badge',
        title: 'Planos flexíveis',
        text: 'Consórcios de imóveis, veículos e serviços.',
      },
    ],
    faq: [
      {
        q: 'O que é um consórcio?',
        a: 'Consórcio é a união de um grupo de pessoas que se organizam para adquirir um bem (imóvel, veículo, etc.) de forma programada, sem juros.',
      },
      {
        q: 'Existe entrada?',
        a: 'Não. O consórcio não exige entrada: você paga parcelas mensais e recebe uma carta de crédito quando é contemplado.',
      },
    ],
    contact: {
      title: 'Vamos conversar?',
      subtitle: 'Deixe seus dados e retorno o quanto antes.',
      cta: 'Enviar',
    },
    legal: 'Consórcio é regulamentado pelo Banco Central do Brasil. As informações exibidas não configuram oferta, mas sim orientação sobre o produto. Cuidado com fraudes.',
  };
}

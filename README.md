# Consorciofy

Plataforma SaaS multi-tenant de landing pages **Liquid Glass** para consultores de consórcio no Brasil. Cada consultor paga uma assinatura mensal recorrente e ganha uma página pública própria e personalizável — sem depender de programação.

## Arquitetura

```
frontend/  Vite + React + TypeScript (SPA, porta 5173)
backend/   Node.js + Express + SQLite (node:sqlite, porta 3001)
```

- O frontend usa **reverse proxy** em `/api` e `/uploads` → backend (config em `frontend/vite.config.ts`), sem CORS em desenvolvimento.
- Banco de dados real SQLite (WAL) com **backups automáticos** diários em `backend/backups/` + backup manual no painel admin.
- Autenticação JWT + **bcrypt** (senha nunca em texto puro), roles `consultant` e `admin`.
- **Validação no servidor** de todo conteúdo (`backend/src/validation.js`) — nada do navegador é confiado.
- **Permissão**: cada consultor só lê/escreve a própria página (`/api/consultant/*` resolve o dono pelo token).

## Começando

```bash
# instalar dependências
cd backend && npm install
cd ../frontend && npm install

# subir tudo (backend :3001 + frontend :5173)
./start.sh
```

Acesse:

| O quê | URL | Login |
| --- | --- | --- |
| Plataforma (landing) | http://localhost:5173 | — |
| Página pública demo | http://localhost:5173/c/ana-costa | — |
| Painel do consultor | http://localhost:5173/dashboard | `demo@consultor.com.br` / `demo12345` |
| Painel admin | http://localhost:5173/admin | `admin@consorciofy.com` / `admin12345` |

> O seed (`backend/src/seed.js`) roda sozinho na 1ª vez e é idempotente: cria o admin, o consultor demo e ativa um trial para a página demo ficar no ar.

## Fluxos implementados

- **Cadastro** → cria usuário + página com slug automático → consultor personaliza no painel → assina → página pública fica no ar.
- **Bloqueio**: admin bloqueia por falta de pagamento/violação → `GET /api/public/:slug` responde `403 { unavailable: true }` e o visitante vê **"Página indisponível"** (sem expor erro técnico).
- **Leads**: o formulário final valida no servidor (com rate-limit), salva no banco **e** abre o WhatsApp do consultor com mensagem pronta.
- **Editor**: identidade (logo, foto recortada, nome, WhatsApp, cidade), hero, tira de confiança, depoimentos, blocos livres (bento grid), FAQ, comparativo, contato e aviso legal. Foto de perfil tem opção de **remover fundo branco automaticamente** no cliente (flood-fill) para virar recorte flutuante.
- **Pagamento recorrente**: serviço com provider (`backend/src/services/payment.js`). O modo padrão é `mock` (checkout de demonstração, sem cartão). Para produção:

```bash
# Mercado Pago
PAYMENT_PROVIDER=mercadopago MP_ACCESS_TOKEN=... MP_EMAIL=...

# Stripe
PAYMENT_PROVIDER=stripe STRIPE_SECRET_KEY=... STRIPE_PRICE_ID=...
```

A plataforma **nunca armazena número de cartão** — quem processa é o provedor; o banco só guarda `customer_id` / `subscription_id` / status.

## API (resumo)

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET  /api/public/:slug`, `POST /api/public/:slug/lead`
- `GET|PUT /api/consultant/page`, `PUT /api/consultant/slug`, `GET /api/consultant/leads`
- `POST /api/upload` (imagem, com validação de tipo)
- `POST /api/payments/checkout`, `POST /api/payments/webhook`, `GET /api/payments/status`
- `GET  /api/admin/consultants`, `GET /api/admin/consultants/:id`
- `POST /api/admin/consultants/:id/block`, `POST /api/admin/consultants/:id/unblock`
- `GET  /api/admin/leads`, `POST /api/admin/backup`

## Banco

SQLite em `backend/data/platform.db` (WAL). Tabelas: `users`, `consultants`, `consultant_content` (JSON de conteúdo), `leads`, `admin_actions`, `settings`. O schema (`backend/src/schema.sql`) é compatível com Postgres para migração futura (ex: Supabase).

## Segurança

- HTTPS é responsabilidade do deploy (proxy/túnel em produção).
- Hash bcrypt, JWT com expiração, CORS restrito ao frontend, rate-limit de leads, validação e sanitização de conteúdo no servidor, uploads validados por MIME e tamanho, headers mínimos (`x-powered-by` desabilitado).
- `JWT_SECRET`, `ADMIN_SETUP_SECRET` e credenciais de provedor via variáveis de ambiente (nunca no código).

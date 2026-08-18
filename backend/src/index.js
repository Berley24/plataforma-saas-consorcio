import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { scheduleBackups } from './db.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import consultantRoutes from './routes/consultant.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';
import uploadRoutes, { UPLOAD_DIR } from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, cb) => {
      // permite o frontend local e o origin null (requests de ferramentas)
      if (!origin || origin.startsWith('http://localhost') || origin.includes('monkeycode-ai')) {
        return cb(null, true);
      }
      return cb(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true }));

// arquivos estáticos de upload
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', immutable: true }));

// rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/consultant', consultantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// 404 da API
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint não encontrado.' }));

// erro genérico
app.use((err, _req, res, _next) => {
  const msg = err?.message || 'Erro interno do servidor.';
  res.status(err?.status || 500).json({ error: msg });
});

app.listen(PORT, () => {
  console.log(`[consorciofy] backend ouvindo em http://localhost:${PORT}`);
  console.log(`[consorciofy] frontend esperado em ${FRONTEND_URL}`);
  scheduleBackups();
});

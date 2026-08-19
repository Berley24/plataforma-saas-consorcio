import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'platform.db');

mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Migrações leves: adiciona colunas que ainda não existem em bases antigas.
function migrate() {
  const cols = db.prepare('PRAGMA table_info(leads)').all().map((c) => c.name);
  const add = (name, def) => {
    if (!cols.includes(name)) {
      db.exec(`ALTER TABLE leads ADD COLUMN ${name} ${def}`);
      cols.push(name);
    }
  };
  add('interest', 'TEXT');                                  // categoria (carro, casa, moto, servicos, alavancagem, agro, outro)
  add('meeting_at', 'TEXT');                                // data/hora da reunião agendada (ISO)
  add('meeting_notes', 'TEXT');                             // resumo da conversa/IA
  add('source', "TEXT NOT NULL DEFAULT 'form'");            // 'form' | 'chat'
}
migrate();

export function nowIso() {
  return new Date().toISOString();
}

export function genSlug(name) {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'consultor';
}

export function uniqueSlug(base) {
  let slug = base;
  let i = 2;
  while (db.prepare('SELECT id FROM consultants WHERE slug = ?').get(slug)) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

// Backup automático simples: copia o arquivo .db para backups/.
export function runBackup() {
  const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(backupDir, `platform-${stamp}.db`);
  try {
    // checkpoint o WAL primeiro
    db.exec('PRAGMA wal_checkpoint(FULL);');
    const src = DB_PATH;
    if (existsSync(src)) {
      writeFileSync(dest, readFileSync(src));
      // também captura o WAL se ainda houver dados não checkpointados
      const wal = `${src}-wal`;
      if (existsSync(wal)) {
        writeFileSync(`${dest}-wal`, readFileSync(wal));
      }
    }
    return dest;
  } catch (err) {
    console.error('Backup failed:', err);
    return null;
  }
}

// Agendamento diário de backups.
export function scheduleBackups(hours = 4) {
  const run = () => {
    const dest = runBackup();
    if (dest) console.log(`[backup] database backed up to ${dest}`);
  };
  run();
  setInterval(run, hours * 60 * 60 * 1000);
}

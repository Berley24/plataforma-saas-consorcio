#!/usr/bin/env bash
# Consorciofy — inicia backend (3001) e frontend (5173).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "→ Seed do banco (idempotente)..."
node --disable-warning=ExperimentalWarning "$ROOT/backend/src/seed.js"

echo "→ Iniciando backend em :3001 ..."
(cd "$ROOT/backend" && npm run dev) &
BACKEND_PID=$!

echo "→ Iniciando frontend em :5173 ..."
(cd "$ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' EXIT

echo ""
echo "Plataforma: http://localhost:5173"
echo "Admin:      http://localhost:5173/admin  (admin@consorciofy.com / admin12345)"
echo "Demo page:  http://localhost:5173/c/ana-costa  (demo@consultor.com.br / demo12345)"
echo ""

wait

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ConsultantSummary, Lead } from '../lib/api';
import { api, setToken, statusLabel, displayDate } from '../lib/api';
import { IconLock, IconCheck } from '../lib/icons';
import './admin.css';

interface Detail {
  consultant: ConsultantSummary & { content: Record<string, unknown> };
  leads: Lead[];
  actions: { id: number; action: string; detail: string; created_at: string }[];
}

export default function Admin() {
  const nav = useNavigate();
  const [list, setList] = useState<ConsultantSummary[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [backupMsg, setBackupMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await api.get<{ consultants: ConsultantSummary[] }>('/api/admin/consultants');
      setList(d.consultants);
    } catch (e) {
      setToken(null);
      nav('/login');
    } finally {
      setLoading(false);
    }
  }, [nav]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (id: number) => {
    setMsg('');
    setReason('');
    const d = await api.get<Detail>(`/api/admin/consultants/${id}`);
    setDetail(d);
  };

  const block = async (id: number) => {
    await api.post(`/api/admin/consultants/${id}/block`, { reason: reason || 'Bloqueio manual.' });
    setMsg('Consultor bloqueado.');
    setDetail(null);
    load();
  };

  const unblock = async (id: number) => {
    await api.post(`/api/admin/consultants/${id}/unblock`);
    setMsg('Consultor liberado.');
    setDetail(null);
    load();
  };

  const backup = async () => {
    const d = await api.post<{ file: string }>('/api/admin/backup');
    setBackupMsg(`Backup criado: ${d.file.split('/').pop()}`);
  };

  if (loading) return <div className="dash-load">carregando…</div>;

  return (
    <div className="admin">
      <div className="dash-nav">
        <div className="nav-logo">
          <span className="logo-mark">C</span>
          <span>Consorciofy · Admin</span>
        </div>
        <div className="dash-nav-right">
          <button className="btn btn-sm btn-secondary" onClick={backup}>
            Fazer backup
          </button>
          <Link className="btn btn-sm btn-secondary" to="/" target="_blank">
            Ver plataforma
          </Link>
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

      <div className="container admin-body">
        {msg && <div className="glass admin-msg"><IconCheck size={16} /> {msg}</div>}
        {backupMsg && <div className="glass admin-msg"><IconCheck size={16} /> {backupMsg}</div>}

        <div className="admin-head">
          <h1>Consultores</h1>
          <p className="muted">{list.length} assinantes registrados</p>
        </div>

        <div className="glass admin-table">
          <table>
            <thead>
              <tr>
                <th>Consultor</th>
                <th>Página</th>
                <th>Status</th>
                <th>Vencimento</th>
                <th>Cadastro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const st = statusLabel[c.subscription_status] || statusLabel.none;
                return (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.display_name}</strong>
                      <p className="mono small muted">{c.email}</p>
                    </td>
                    <td>
                      <Link to={`/c/${c.slug}`} target="_blank" className="admin-slug mono">
                        /c/{c.slug}
                      </Link>
                    </td>
                    <td>
                      <span className={`status-pill ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="mono small">{displayDate(c.active_until)}</td>
                    <td className="mono small">{displayDate(c.created_at)}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => open(c.id)}>
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted text-center">
                    Nenhum consultor ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {detail && (
          <div className="admin-modal">
            <div className="glass admin-modal-card">
              <div className="row-between">
                <h2>{detail.consultant.display_name}</h2>
                <button className="icon-btn" onClick={() => setDetail(null)}>×</button>
              </div>
              <div className="mono small muted mb-2">
                /c/{detail.consultant.slug} · {detail.consultant.email}
              </div>
              <div className="admin-modal-grid">
                <div>
                  <h4>Status</h4>
                  <span className={`status-pill ${(statusLabel[detail.consultant.subscription_status] || statusLabel.none).cls}`}>
                    {(statusLabel[detail.consultant.subscription_status] || statusLabel.none).label}
                  </span>
                  <p className="small muted mt-2">
                    Bloqueado: {detail.consultant.blocked_at ? displayDate(detail.consultant.blocked_at) : 'não'}
                  </p>
                  {detail.consultant.blocked_reason && (
                    <p className="small">Motivo: {detail.consultant.blocked_reason}</p>
                  )}
                </div>
                <div>
                  <h4>Leads ({detail.leads.length})</h4>
                  <div className="admin-leads">
                    {detail.leads.map((l) => (
                      <div key={l.id} className="admin-lead">
                        <strong>{l.name}</strong>
                        <span className="mono small">{l.whatsapp || '—'}</span>
                        <span className="small muted">{l.message || l.email || ''}</span>
                        <span className="mono tiny">{displayDate(l.created_at)}</span>
                      </div>
                    ))}
                    {detail.leads.length === 0 && <p className="small muted">Sem leads.</p>}
                  </div>
                </div>
              </div>

              <div className="admin-actions">
                {detail.consultant.subscription_status !== 'blocked' ? (
                  <>
                    <input
                      className="input"
                      placeholder="Motivo do bloqueio (ex: pagamento em atraso)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <button className="btn" onClick={() => block(detail.consultant.id)}>
                      <IconLock size={15} />
                      Bloquear página
                    </button>
                  </>
                ) : (
                  <button className="btn" onClick={() => unblock(detail.consultant.id)}>
                    <IconCheck size={15} />
                    Liberar página
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken } from '../lib/api';
import { IconLock } from '../lib/icons';
import './auth.css';

export function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ token: string; user: { role: string }; slug?: string }>(
        '/api/auth/login',
        form
      );
      setToken(data.token);
      if (data.user.role === 'admin') nav('/admin');
      else nav('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="a-page">
      <div className="glass a-card">
        <Link to="/" className="a-logo">
          <span className="logo-mark">C</span>
          <span>Consorciofy</span>
        </Link>
        <h1>Entrar</h1>
        <p className="a-sub">Acesse seu painel de consultor ou administração.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>E-mail</label>
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="voce@email.com"
            />
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              className="input"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="a-error">{error}</p>}
          <button className="btn btn-lg btn-block" disabled={loading}>
            <IconLock size={16} />
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="a-foot">
          Ainda não tem conta? <Link to="/register">Crie sua página grátis</Link>
        </p>
      </div>
    </div>
  );
}

export function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', whatsapp: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ token: string; consultantId: number }>(
        '/api/auth/register',
        form
      );
      setToken(data.token);
      nav('/dashboard?welcome=1');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="a-page">
      <div className="glass a-card">
        <Link to="/" className="a-logo">
          <span className="logo-mark">C</span>
          <span>Consorciofy</span>
        </Link>
        <h1>Criar minha página</h1>
        <p className="a-sub">Seu nome de página é gerado automaticamente. Edite quando quiser.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Nome do consultor</label>
            <input
              className="input"
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ana Costa"
            />
          </div>
          <div className="field">
            <label>E-mail</label>
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="voce@email.com"
            />
          </div>
          <div className="field">
            <label>WhatsApp</label>
            <input
              className="input"
              inputMode="tel"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              className="input"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          {error && <p className="a-error">{error}</p>}
          <button className="btn btn-lg btn-block" disabled={loading}>
            {loading ? 'Criando…' : 'Criar conta'}
          </button>
        </form>
        <p className="a-foot">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

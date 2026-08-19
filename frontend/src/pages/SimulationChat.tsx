import { useEffect, useMemo, useRef, useState } from 'react';
import type { PageContent, ChatReply, ChatProfile } from '../lib/api';
import { api, whatsappLink } from '../lib/api';
import { IconWhatsapp, IconCheck, IconSparkle, IconBolt, IconCalendar } from '../lib/icons';
import './simulation.css';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK = [
  { label: 'Carro', text: 'Quero um consórcio de carro' },
  { label: 'Casa', text: 'Quero um consórcio de casa' },
  { label: 'Moto', text: 'Quero um consórcio de moto' },
  { label: 'Serviços', text: 'Quero um consórcio de serviços' },
  { label: 'Alavancagem', text: 'Quero fazer alavancagem' },
  { label: 'Agro', text: 'Quero um consórcio para o agro' },
];

const SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const INTEREST_LABEL: Record<string, string> = {
  carro: 'Carro',
  casa: 'Casa / Imóvel',
  moto: 'Moto',
  servicos: 'Serviços',
  alavancagem: 'Alavancagem',
  agro: 'Agro',
  outro: 'Outro',
};

function todayMin() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function fmtMeeting(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function SimulationChat({ content, slug }: { content: PageContent; slug: string }) {
  const { identity } = content;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [intent, setIntent] = useState('');
  const [profile, setProfile] = useState<ChatProfile>({ name: '', whatsapp: '', value: '', plazo: '' });
  const [slot, setSlot] = useState('');
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs([
      {
        role: 'assistant',
        content: `Olá! Eu sou o(a) assistente virtual do(a) ${identity.name}. Vamos descobrir qual consórcio combina com você? Você tem interesse em carro, casa, moto, serviços, alavancagem ou agro?`,
      },
    ]);
  }, [identity.name]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy]);

  const shownQuick = useMemo(() => {
    const said = msgs
      .filter((m) => m.role === 'user')
      .map((m) => m.content.toLowerCase())
      .join(' ');
    return QUICK.filter((q) => !said.includes(q.text.slice(5, 18).toLowerCase()));
  }, [msgs]);

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || busy || booked) return;
    const history: Msg[] = [...msgs, { role: 'user', content: t }];
    setMsgs(history);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const d = await api.post<ChatReply>(`/api/public/${slug}/chat`, { messages: history });
      setMsgs((prev) => [...prev, { role: 'assistant', content: d.reply }]);
      setReady(d.ready_for_meeting);
      if (d.intent) setIntent(d.intent);
      if (d.profile) {
        setProfile(d.profile);
        setName((v) => v || d.profile.name || '');
        setWhatsapp((v) => v || d.profile.whatsapp || '');
      }
    } catch (err) {
      setError((err as Error).message || 'Não consegui responder. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!date || !slot) {
      setError('Escolha o dia e o horário da reunião.');
      return;
    }
    const cleanName = name.trim();
    const cleanWhats = whatsapp.replace(/\D/g, '');
    if (!cleanName || cleanWhats.length < 10) {
      setError('Informe nome e WhatsApp com DDD para agendar.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const when = new Date(`${date}T${slot}:00`);
      const interest = INTEREST_LABEL[intent] || '';
      const r = await api.post<{ ok: boolean; meeting_scheduled?: boolean }>(
        `/api/public/${slug}/lead`,
        {
          name: cleanName,
          whatsapp: cleanWhats,
          interest: intent || undefined,
          meeting_at: when.toISOString(),
          meeting_notes:
            `Interesse: ${interest || 'a definir'}${profile?.value ? ` de ${profile.value}` : ''}${profile?.plazo ? `, prazo ${profile.plazo} meses` : ''}.`,
          message: 'Reunião agendada pelo chat de simulação.',
        }
      );
      if (r.ok) {
        setBooked(true);
        setReady(false);
      } else {
        setError('Não foi possível agendar. Tente de novo.');
      }
    } catch (err) {
      setError((err as Error).message || 'Erro ao agendar.');
    } finally {
      setBusy(false);
    }
  };

  const waBook = whatsappLink(
    identity.whatsapp,
    `Olá! Sou ${name || 'um visitante'}. Acabei de agendar uma reunião pela sua página de simulação para ${date ? fmtMeeting(`${date}T${slot || '00:00'}:00`) : 'a reunião agendada'}.`
  );

  return (
    <div className="glass sim">
      {/* header */}
      <div className="sim-head">
        <div className="sim-avatar">
          <IconSparkle size={16} />
        </div>
        <div>
          <strong>{identity.name}</strong>
          <span className="mono">assistente de simulação · online</span>
        </div>
        <span className="sim-online"><i /> online</span>
      </div>

      {booked ? (
        <div className="sim-done">
          <div className="verified-badge lg">
            <IconCheck size={18} />
          </div>
          <h3>Reunião agendada!</h3>
          <p>
            {name || 'Você'} ficou na agenda do(a) {identity.name} para{' '}
            <strong>{date ? fmtMeeting(`${date}T${slot}:00`) : 'o horário escolhido'}</strong>.
          </p>
          <p className="small">Que tal já avisar no WhatsApp para confirmar?</p>
          <a className="btn btn-lg" href={waBook} target="_blank" rel="noreferrer">
            <IconWhatsapp size={18} />
            Confirmar no WhatsApp
          </a>
        </div>
      ) : (
        <>
          <div className="sim-body" ref={scrollRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`sim-msg ${m.role === 'user' ? 'user' : 'bot'}`}>
                {m.role === 'assistant' && (
                  <span className="sim-msg-avatar"><IconSparkle size={11} /></span>
                )}
                <div className="sim-bubble">{m.content}</div>
              </div>
            ))}
            {busy && (
              <div className="sim-msg bot">
                <span className="sim-msg-avatar"><IconSparkle size={11} /></span>
                <div className="sim-bubble sim-typing"><i /><i /><i /></div>
              </div>
            )}
          </div>

          {ready && !booked && (
            <div className="sim-scheduler">
              <div className="sim-sched-title">
                <IconCalendar size={16} />
                <span>Agendar reunião com o(a) {identity.name}</span>
              </div>
              <div className="sim-sched-row">
                <input
                  className="input"
                  type="date"
                  min={todayMin()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="sim-slots">
                {SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`sim-slot ${slot === s ? 'active' : ''}`}
                    onClick={() => setSlot(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="grid-2">
                <input className="input" placeholder="Seu nome" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
                <input className="input" placeholder="WhatsApp com DDD" inputMode="tel" maxLength={13} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))} />
              </div>
              {error && <p className="sim-error small">{error}</p>}
              <button className="btn btn-lg btn-block" onClick={confirm} disabled={busy}>
                <IconBolt size={18} />
                {busy ? 'Agendando…' : 'Confirmar reunião'}
              </button>
            </div>
          )}

          {!ready && (
            <>
              <div className="sim-quick">
                {shownQuick.map((q) => (
                  <button key={q.label} className="sim-chip" onClick={() => send(q.text)} disabled={busy}>
                    {q.label}
                  </button>
                ))}
              </div>
              <div className="sim-input">
                <input
                  className="input"
                  placeholder="Escreva sua mensagem…"
                  value={input}
                  maxLength={500}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                />
                <button className="btn" onClick={() => send()} disabled={busy || !input.trim()}>
                  <IconWhatsapp size={17} />
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

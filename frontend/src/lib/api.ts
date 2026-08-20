export interface TrustItem { icon: string; title: string; text: string }
export interface Step { title: string; text: string }
export interface ComparisonPoint { title: string; text: string }
export interface Testimonial { name: string; role: string; text: string }
export interface ModuleItem { type: 'badge' | 'photo' | 'video' | 'certificate' | 'partner'; title: string; text: string; media: string }
export interface FaqItem { q: string; a: string }

export interface PageContent {
  logo: string;
  brandName: string;
  tagline: string;
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    cta: string;
    ctaSecondary: string;
  };
  identity: {
    photo: string;
    verified: boolean;
    name: string;
    role: string;
    city: string;
    whatsapp: string;
    whatsappMessage: string;
  };
  trust: TrustItem[];
  howItWorks: Step[];
  comparison: { title: string; subtitle: string; consortium: ComparisonPoint[]; financing: ComparisonPoint[] };
  about: { photo: string; bio: string };
  testimonials: Testimonial[];
  modules: ModuleItem[];
  faq: FaqItem[];
  contact: { title: string; subtitle: string; cta: string };
  legal: string;
  knowledge: string;
}

export interface PublicPage {
  slug: string;
  displayName: string;
  content: PageContent;
}

export interface ConsultantSummary {
  id: number;
  slug: string;
  display_name: string;
  plan: string;
  subscription_status: string;
  current_period_end: string | null;
  active_until: string | null;
  blocked_at: string | null;
  blocked_reason: string | null;
  created_at: string;
  email?: string;
}

export interface Lead {
  id: number;
  name: string;
  whatsapp: string;
  email: string;
  message: string;
  interest: string | null;
  meeting_at: string | null;
  meeting_notes: string | null;
  source: string;
  created_at: string;
}

export interface ChatProfile {
  name: string;
  whatsapp: string;
  value: string;
  plazo: string;
}

export interface ChatReply {
  reply: string;
  intent: string;
  ready_for_meeting: boolean;
  profile: ChatProfile;
}

export interface Plan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
}

export interface CheckoutInfo {
  subscriptionId: string;
  subscription_status: string;
  plan: Plan;
}

const TOKEN_KEY = 'consorciofy_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string> || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && typeof opts.body === 'string') headers['Content-Type'] = 'application/json';

  const res = await fetch(path, { ...opts, headers });
  if (res.status === 401) {
    setToken(null);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as { error?: string }).error || 'Erro inesperado.');
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
};

export const whatsappLink = (phone: string, message: string) => {
  const clean = String(phone || '').replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
};

export const displayDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
};

export const statusLabel: Record<string, { label: string; cls: string }> = {
  none: { label: 'Sem assinatura', cls: 'status-none' },
  pending: { label: 'Aguardando pagamento', cls: 'status-pending' },
  trial: { label: 'Trial', cls: 'status-trial' },
  active: { label: 'Ativa', cls: 'status-active' },
  past_due: { label: 'Inadimplente', cls: 'status-past_due' },
  cancelled: { label: 'Cancelada', cls: 'status-cancelled' },
  blocked: { label: 'Bloqueada', cls: 'status-blocked' },
};

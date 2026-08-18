// Validação estrita no servidor de todo conteúdo editável.
// Nada vindo do navegador é confiado sem passar por aqui.

const MAX = {
  string: 5000,
  text: 5000,
  headline: 160,
  subheadline: 300,
  name: 120,
  whatsapp: 30,
  city: 120,
  role: 120,
  title: 120,
  bio: 6000,
  legal: 6000,
};

function str(v, max = MAX.string, min = 0) {
  if (v === undefined || v === null) return '';
  const s = String(v).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function isImageUrl(v) {
  if (!v) return '';
  const s = String(v).trim();
  // só aceita /uploads/ local ou http(s)
  if (s.startsWith('/uploads/')) return s;
  if (/^https?:\/\/[^\s]+\.[^\s]+/i.test(s)) return s;
  return '';
}

function isMediaUrl(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (s.startsWith('/uploads/')) return s;
  if (s.startsWith('data:image/')) return s.slice(0, 300000);
  if (/^https?:\/\//i.test(s)) return s;
  return '';
}

function bool(v, def = false) {
  return v === true || v === 'true' || v === 1 || v === '1' ? true : def;
}

function cleanTrust(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, 6)
    .map((t) => ({
      icon: str(t?.icon, 30),
      title: str(t?.title, MAX.title),
      text: str(t?.text, 300),
    }))
    .filter((t) => t.title || t.text);
}

function cleanSteps(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, 6)
    .map((s) => ({ title: str(s?.title, MAX.title), text: str(s?.text, 400) }))
    .filter((s) => s.title || s.text);
}

function cleanComparisonPoints(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, 6)
    .map((p) => ({ title: str(p?.title, MAX.title), text: str(p?.text, 400) }))
    .filter((p) => p.title || p.text);
}

function cleanTestimonials(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, 12)
    .map((t) => ({
      name: str(t?.name, MAX.name),
      role: str(t?.role, MAX.role),
      text: str(t?.text, 1000),
    }))
    .filter((t) => t.name || t.text);
}

function cleanModules(arr) {
  if (!Array.isArray(arr)) return [];
  const allowed = ['badge', 'photo', 'video', 'certificate', 'partner'];
  return arr
    .slice(0, 12)
    .map((m) => {
      const type = allowed.includes(m?.type) ? m.type : 'badge';
      return {
        type,
        title: str(m?.title, MAX.title),
        text: str(m?.text, 400),
        media: type === 'photo' || type === 'video' ? isMediaUrl(m?.media) : '',
      };
    })
    .filter((m) => m.title || m.text || m.media);
}

function cleanFaq(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, 12)
    .map((f) => ({ q: str(f?.q, 300), a: str(f?.a, 2000) }))
    .filter((f) => f.q && f.a);
}

export function sanitizeContent(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};

  const content = {
    brandName: str(c.brandName, MAX.name),
    tagline: str(c.tagline, MAX.title),
    hero: {
      badge: str(c.hero?.badge, MAX.title),
      headline: str(c.hero?.headline, MAX.headline),
      subheadline: str(c.hero?.subheadline, MAX.subheadline),
      cta: str(c.hero?.cta, 60),
      ctaSecondary: str(c.hero?.ctaSecondary, 60),
    },
    identity: {
      photo: isImageUrl(c.identity?.photo),
      verified: bool(c.identity?.verified, true),
      name: str(c.identity?.name, MAX.name),
      role: str(c.identity?.role, MAX.role),
      city: str(c.identity?.city, MAX.city),
      whatsapp: str(c.identity?.whatsapp, MAX.whatsapp).replace(/\D/g, '').slice(0, 13),
      whatsappMessage: str(c.identity?.whatsappMessage, 300),
    },
    trust: cleanTrust(c.trust),
    howItWorks: cleanSteps(c.howItWorks),
    comparison: {
      title: str(c.comparison?.title, MAX.title),
      subtitle: str(c.comparison?.subtitle, 300),
      consortium: cleanComparisonPoints(c.comparison?.consortium),
      financing: cleanComparisonPoints(c.comparison?.financing),
    },
    about: {
      photo: isImageUrl(c.about?.photo),
      bio: str(c.about?.bio, MAX.bio),
    },
    testimonials: cleanTestimonials(c.testimonials),
    modules: cleanModules(c.modules),
    faq: cleanFaq(c.faq),
    contact: {
      title: str(c.contact?.title, MAX.title),
      subtitle: str(c.contact?.subtitle, 300),
      cta: str(c.contact?.cta, 60),
    },
    legal: str(c.legal, MAX.legal),
  };

  return content;
}

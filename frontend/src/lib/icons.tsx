// Ícones em SVG (linha 1.5), seguindo o padrão do sistema Apple.
interface IconProps {
  size?: number;
  className?: string;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const IconWhatsapp = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" />
    <path d="M9.2 8.2c-.3.8.2 1.9 1 2.9.9 1 1.8 1.6 2.6 1.8.8.2 1.3-.1 1.6-.6" />
    <path d="M15.5 15.2c.5-.4.8-1 .7-1.5" />
  </svg>
);

export const IconCheck = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2.6}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

export const IconShield = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3 5 6v5c0 4.6 3 8.2 7 9.7 4-1.5 7-5.1 7-9.7V6l-7-3Z" />
    <path d="m9.2 11.8 2 2 3.6-3.9" />
  </svg>
);

export const IconRocket = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M5 15c-1.5 1-2 3-2 3s2-.5 3-2" />
    <path d="M14 4.5c3.6-1.4 6-1.4 6-1.4s0 2.4-1.4 6C17.6 11 15.5 11 14 9.5S13 6.1 14 4.5Z" />
    <path d="M11 13l2.5-2.5a4 4 0 0 1 5-5l-2.5 2.5a3 3 0 0 0-.8 1.9l.3 2.6-2 2-.4-.2" />
  </svg>
);

export const IconMedal = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="9" r="5.5" />
    <path d="m9.5 13.5-2 7 4.5-2.5 4.5 2.5-2-7" />
    <path d="M12 6.6c.6 1.2 1.8 2 3.2 2.1" />
  </svg>
);

export const IconBolt = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />
  </svg>
);

export const IconCard = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="6" width="18" height="13" rx="3" />
    <path d="M3 10h18M7 15h4" />
  </svg>
);

export const IconChart = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
  </svg>
);

export const IconUsers = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.4 3-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M16 14.6c2.7.4 4.6 2.3 5 5.4" />
  </svg>
);

export const IconQuote = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M9.5 7C6.5 8.2 5 10.4 5 13.4V17h4.5v-4.5H7.2c.2-1.7 1.1-2.8 2.8-3.5L9.5 7Z" />
    <path d="M19 7c-3 1.2-4.5 3.4-4.5 6.4V17H19v-4.5h-2.3c.2-1.7 1.1-2.8 2.8-3.5L19 7Z" />
  </svg>
);

export const IconX = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconPlus = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconTrash = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />
  </svg>
);

export const IconArrowRight = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12h16m-6-6 6 6-6 6" />
  </svg>
);

export const IconChevronDown = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconLock = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="5" y="11" width="14" height="9" rx="3" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconMail = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

export const IconMapPin = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10Z" />
    <circle cx="12" cy="10.5" r="2.2" />
  </svg>
);

export const IconCamera = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 7h3l2-2h6l2 2h3v12H4V7Z" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
);

export const IconVideo = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="5" width="13" height="14" rx="3" />
    <path d="m16 10 5-3v10l-5-3" />
  </svg>
);

export const IconAward = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="9" r="5" />
    <path d="m9 13-1.5 7L12 17l4.5 3L15 13" />
  </svg>
);

export const IconSparkle = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3c.6 3.7 1.9 5.8 4 7-2.1 1.2-3.4 3.3-4 7-.6-3.7-1.9-5.8-4-7 2.1-1.2 3.4-3.3 4-7Z" />
    <path d="M19 13c.3 1.7.8 2.6 1.8 3.2-1 .6-1.5 1.5-1.8 3.2-.3-1.7-.8-2.6-1.8-3.2 1-.6 1.5-1.5 1.8-3.2Z" />
  </svg>
);

export const IconCalendar = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 9h18M8 3v4M16 3v4" />
    <path d="m9 15 2 2 4-4" />
  </svg>
);

const ICONS: Record<string, (p: IconProps) => JSX.Element> = {
  shield: IconShield,
  rocket: IconRocket,
  medal: IconMedal,
  bolt: IconBolt,
  card: IconCard,
  chart: IconChart,
  users: IconUsers,
  award: IconAward,
  sparkle: IconSparkle,
};

export function TrustIcon({ name, size = 22 }: { name: string; size?: number }) {
  const C = ICONS[name] || IconShield;
  return <C size={size} />;
}

export function ModuleIcon({ type }: { type: string }) {
  switch (type) {
    case 'photo':
      return <IconCamera size={20} />;
    case 'video':
      return <IconVideo size={20} />;
    case 'certificate':
      return <IconAward size={20} />;
    case 'partner':
      return <IconUsers size={20} />;
    default:
      return <IconSparkle size={20} />;
  }
}

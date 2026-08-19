// Serviço de IA para o chat de simulação da página pública.
// Usa um LLM via API compatível com OpenAI (variáveis USER_LLM_* do projeto).
// Sem chave configurada, cai num fluxo roteirizado (fallback) que funciona sozinho.

const CATEGORIES = {
  carro: ['carro', 'car', 'veícul', 'suv', 'pickup', 'picape', 'caminhonete', 'hatch', 'sedan', 'auto'],
  casa: ['casa', 'imóvel', 'imovel', 'apartamento', 'ape', 'terreno', 'moradia', 'sobrado'],
  moto: ['moto', 'motocicleta', 'scooter', 'honda', 'yamaha'],
  servicos: ['serviço', 'servico', 'serviços', 'cirurgia', 'viagem', 'festa', 'formatura', 'curso', 'reforma', 'evento'],
  alavancagem: ['alavanc', 'invest', 'capital', 'giro', 'reserva', 'oportunidade', 'limite'],
  agro: ['agro', 'trator', 'máquina', 'maquina', 'colheitadeira', 'gado', 'fazenda', 'agrícola', 'agricola'],
};

const CATEGORY_REPLY = {
  carro: 'Ótima escolha! Consórcio de veículos não cobra juros — só a taxa de administração. Já tem um valor de carro em mente?',
  casa: 'Casa própria é um baita passo! No consórcio de imóveis você recebe uma carta de crédito e compra à vista. Qual valor você está pensando?',
  moto: 'Boa! Consórcio de moto tem parcelas bem leves. Que modelo ou valor você está imaginando?',
  servicos: 'Que legal! Cirurgia, viagem, festa, curso… tudo isso cabe em um consórcio de serviços. Qual seria o valor do serviço?',
  alavancagem: 'Alavancagem é uma estratégia inteligente: usar a carta de crédito para investir ou girar capital. Qual valor você quer alavancar?',
  agro: 'No agro o consórcio financia tratores, máquinas e implementos sem juros. Qual máquina ou valor você tem em mente?',
};

function clean(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function detectCategory(text) {
  const t = clean(text);
  let best = 'outro';
  let score = 0;
  for (const [cat, words] of Object.entries(CATEGORIES)) {
    let s = 0;
    for (const w of words) {
      if (new RegExp(`\\b${w}`, 'i').test(t)) s++;
    }
    if (s > score) {
      score = s;
      best = cat;
    }
  }
  return score > 0 ? best : 'outro';
}

function detectCategoryFromMessages(userMsgs) {
  for (const m of userMsgs) {
    const c = detectCategory(m.content);
    if (c !== 'outro') return c;
  }
  return 'outro';
}

function extractPhone(text) {
  const digits = String(text || '').replace(/\D/g, '');
  const m = digits.match(/(?:55)?(\d{2})(\d{4,5})(\d{4})/);
  return m ? `+55${m[1]}${m[2]}${m[3]}` : '';
}

function extractValue(text) {
  const t = clean(String(text || ''));
  // "r$ 50.000", "50 mil", "50k", "100000"
  let m = t.match(/r\$\s?([\d.,]+ ?(?:mil|k)?)/);
  if (!m) m = t.match(/(\d{1,3}(?:[.,]\d{3})*(?: mil|k)?)/);
  if (!m) return '';
  let v = m[1].trim();
  if (/( mil|k)$/.test(v)) v = v.replace(/( mil|k)$/, ' mil');
  if (/\.\d{3}$/.test(v)) v = v.replace(/\./g, '');
  return v;
}

function extractPlazo(text) {
  const t = clean(String(text || ''));
  const m = t.match(/(\d{2,3})\s*(?:meses|mes|parcelas|x|parcela)/);
  return m ? m[1] : '';
}

function extractName(text) {
  const t = clean(String(text || ''));
  const m = t.match(/(?:meu nome (?:é|e)|sou (?:o |a )?|me chamo|meu nome:?|nome:?)\s*([a-záàâãéêíóôõúç]+(?:\s+[a-záàâãéêíóôõúç]+)?)/);
  if (!m) return '';
  const stops = ['meu', 'me', 'e', 'é', 'com', 'de', 'da', 'do', 'em', 'que', 'sou', 'eu', 'quero', 'preciso', 'para'];
  const kept = [];
  for (const w of m[1].split(' ')) {
    if (stops.includes(w)) break;
    kept.push(w);
  }
  return kept[0] ? kept.join(' ') : '';
}

function buildProfile(messages) {
  const userMsgs = messages.filter((m) => m.role === 'user');
  const all = userMsgs.map((m) => m.content).join(' ');
  const last = userMsgs[userMsgs.length - 1]?.content || '';
  return {
    name: extractName(all),
    whatsapp: extractPhone(last),
    value: extractValue(all),
    plazo: extractPlazo(all),
    category: detectCategoryFromMessages(userMsgs),
  };
}

// Fluxo roteirizado usado quando não há LLM configurado.
function fallbackChat(messages) {
  const userMsgs = messages.filter((m) => m.role === 'user');
  const p = buildProfile(messages);
  const last = userMsgs[userMsgs.length - 1]?.content || '';

  const withName = p.name ? `${p.name[0].toUpperCase()}${p.name.slice(1)}` : '';

  if (!p.category || p.category === 'outro') {
    return {
      reply: last
        ? 'Entendi! Pode me dizer melhor: você tem interesse em consórcio de carro, casa, moto, serviços, alavancagem ou agro?'
        : 'Olá! Sou a assistente virtual do consultor. Para começarmos, conta pra mim: você tem interesse em carro, casa, moto, serviços, alavancagem ou agro?',
      intent: 'outro',
      ready_for_meeting: false,
      profile: p,
    };
  }

  if (!p.value) {
    return {
      reply: `${withName ? `${withName}, ` : ''}${CATEGORY_REPLY[p.category]}`,
      intent: p.category,
      ready_for_meeting: false,
      profile: p,
    };
  }

  if (!p.plazo) {
    return {
      reply: `Perfeito${withName ? `, ${withName}` : ''}! E em quanto tempo você gostaria de pagar? Temos planos de 30 a 200 meses — qual prazo combina melhor com você?`,
      intent: p.category,
      ready_for_meeting: false,
      profile: p,
    };
  }

  if (!p.name) {
    return {
      reply: `Excelente! Resumindo: ${withName || 'você'} quer ${p.category === 'alavancagem' ? 'alavancar' : p.category === 'servicos' ? 'um plano de serviços' : 'um consórcio de ' + p.category} de ${p.value} em ${p.plazo} meses. Qual o seu nome?`,
      intent: p.category,
      ready_for_meeting: false,
      profile: p,
    };
  }

  if (!p.whatsapp) {
    return {
      reply: `Prazer, ${withName}! Para eu marcar uma conversa com o consultor, me passa seu WhatsApp com DDD?`,
      intent: p.category,
      ready_for_meeting: false,
      profile: p,
    };
  }

  return {
    reply: `Perfeito, ${withName}! Vi que você tem interesse em ${p.category === 'alavancagem' ? 'alavancagem' : p.category === 'servicos' ? 'serviços' : 'consórcio de ' + p.category} de ${p.value}, com parcelas em ${p.plazo} meses. Que tal agendar uma reunião rápida com o consultor para montarmos sua simulação completa? É só escolher o dia e horário.`,
    intent: p.category,
    ready_for_meeting: true,
    profile: p,
  };
}

function getConfig() {
  return {
    apiKey: process.env.USER_LLM_API_KEY || '',
    baseUrl: (process.env.USER_LLM_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, ''),
    model: process.env.USER_LLM_MODEL || 'deepseek-chat',
  };
}

export function isAiConfigured() {
  return Boolean(getConfig().apiKey);
}

function systemPrompt(consultant, content) {
  const c = content || {};
  const identity = c.identity || {};
  const safe = (v, d) => String(v || d).slice(0, 400);
  return [
    `Você é ${safe(identity.name, 'o consultor')}, consultor(a) de consórcio da marca "${safe(c.brandName, 'Consorciofy')}" em ${safe(identity.city, 'Brasil')}.`,
    `Você conversa com visitantes no site para descobrir o interesse e agendar uma reunião com ${safe(identity.name, 'o consultor')}.`,
    '',
    'CATEGORIAS de consórcio que você atende:',
    '- carro (veículos)',
    '- casa (imóveis, terreno)',
    '- moto',
    '- servicos (cirurgia, viagem, festa, curso, reforma, eventos)',
    '- alavancagem (usar carta de crédito para investir ou girar capital)',
    '- agro (tratores, máquinas, implementos)',
    '- outro',
    '',
    'REGRA DE OURO: o objetivo é agendar uma reunião. Conduza em etapas, UMA pergunta por vez:',
    '1) descubra a categoria de interesse;',
    '2) descubra o valor aproximado do bem/serviço;',
    '3) descubra o prazo desejado em meses;',
    '4) peça o nome da pessoa;',
    '5) peça o WhatsApp com DDD;',
    '6) só então sinalize que está pronto para agendar.',
    '',
    'SOBRE A CONVERSA:',
    '- Responda sempre em português do Brasil, de forma natural, calorosa e humana. NADA de respostas de robô.',
    '- Use frases curtas (1 a 3). Faça uma pergunta por vez.',
    '- Mencione que consórcio não cobra juros (apenas taxa de administração) quando for natural.',
    '- Nunca invente nome, telefone, valores ou informações que a pessoa não informou.',
    '- Se a pessoa responder algo fora do tema, conduza de volta com empatia.',
    '',
    `Contexto sobre ${safe(identity.name, 'o consultor')}: ${safe(c.about && c.about.bio, '')}`,
    '',
    'SAÍDA: responda APENAS com um objeto JSON, sem markdown, neste formato:',
    '{"reply":"sua mensagem","intent":"carro|casa|moto|servicos|alavancagem|agro|outro","ready_for_meeting":false,"profile":{"name":"","whatsapp":"","value":"","plazo":""}}',
    '- "reply": a mensagem que será exibida ao visitante.',
    '- "intent": a categoria detectada.',
    '- "ready_for_meeting": true SOMENTE quando nome, whatsapp e intenção já foram informados.',
    '- "profile": preencha apenas campos que a pessoa já informou (não invente).',
  ].join('\n');
}

async function callLLM(messages) {
  const cfg = getConfig();
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: 0.75,
      max_tokens: 320,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`LLM ${res.status}: ${t.slice(0, 180)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('LLM: resposta vazia.');
  return text;
}

function parseReply(text) {
  let t = String(text || '').trim();
  t = t.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return { reply: t || 'Pode me contar um pouco mais?', intent: 'outro', ready_for_meeting: false, profile: {} };
  }
  try {
    const obj = JSON.parse(t.slice(start, end + 1));
    const intent = ['carro', 'casa', 'moto', 'servicos', 'alavancagem', 'agro', 'outro'].includes(obj.intent) ? obj.intent : 'outro';
    return {
      reply: String(obj.reply || 'Pode me contar um pouco mais?').slice(0, 600),
      intent,
      ready_for_meeting: Boolean(obj.ready_for_meeting),
      profile: {
        name: String(obj.profile?.name || '').slice(0, 120),
        whatsapp: String(obj.profile?.whatsapp || '').replace(/\D/g, '').slice(0, 13),
        value: String(obj.profile?.value || '').slice(0, 60),
        plazo: String(obj.profile?.plazo || '').slice(0, 20),
      },
    };
  } catch {
    return { reply: t.slice(0, 600), intent: 'outro', ready_for_meeting: false, profile: {} };
  }
}

// Ponto de entrada principal.
export async function chat(history, consultant, content) {
  if (!isAiConfigured()) return fallbackChat(history);

  const system = { role: 'system', content: systemPrompt(consultant, content) };
  const msgs = history.slice(-16).map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content || '').slice(0, 500),
  }));
  try {
    const raw = await callLLM([system, ...msgs]);
    return parseReply(raw);
  } catch (err) {
    console.error('[ai] fallback após erro do LLM:', err.message);
    return fallbackChat(history);
  }
}

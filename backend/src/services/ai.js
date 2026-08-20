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

function isNameAsk(text) {
  const t = clean(text);
  return /qual (?:e|e)\s+(?:o\s+)?seu nome|seu nome|nome\b|como (?:posso\s+)?te chamar|prazer|pode me dizer seu nome/.test(t);
}

function isLikelyName(text) {
  const t = String(text || '').trim();
  if (!t || t.length > 40) return false;
  if (/\d/.test(t)) return false;
  if (/([.,]|r\$|mil|reais|parcela|consorcio|consórcio|interesse|quero|preciso)/i.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length > 3) return false;
  return words.every((w) => /^[a-záàâãéêíóôõúç]+$/i.test(w));
}

function buildProfile(messages) {
  const userMsgs = messages.filter((m) => m.role === 'user');
  const last = userMsgs[userMsgs.length - 1]?.content || '';
  const all = userMsgs.map((m) => m.content).join(' ');

  let name = extractName(all);

  // Se em ALGUM momento perguntamos o nome e a resposta seguinte foi só o nome
  // (ex: "João"), aceite essa resposta como o nome — sem precisar de "sou"/"me chamo".
  // Isso evita perder o nome nas turnas seguintes do fluxo.
  if (!name) {
    for (let i = 0; i < messages.length - 1; i++) {
      const m = messages[i];
      const next = messages[i + 1];
      if (m.role === 'assistant' && isNameAsk(m.content) && next.role === 'user' && isLikelyName(next.content)) {
        name = clean(next.content).trim();
        break;
      }
    }
  }

  let category = detectCategoryFromMessages(userMsgs);

  return {
    name,
    whatsapp: extractPhone(last),
    value: extractValue(all),
    plazo: extractPlazo(all),
    category,
  };
}

// Fluxo roteirizado usado quando não há LLM configurado.
function fallbackChat(messages) {
  const userMsgs = messages.filter((m) => m.role === 'user');
  const p = buildProfile(messages);
  const last = userMsgs[userMsgs.length - 1]?.content || '';

  const withName = p.name ? p.name[0].toUpperCase() + p.name.slice(1) : '';

  if (!p.name) {
    return {
      reply: last
        ? 'Que bom te conhecer por aqui! Antes de qualquer coisa, qual é o seu nome?'
        : 'Olá! Sou a assistente virtual do consultor. Antes de qualquer coisa, qual é o seu nome?',
      intent: 'outro',
      ready_for_meeting: false,
      profile: p,
    };
  }

  if (!p.category || p.category === 'outro') {
    return {
      reply: `${withName}, que bom te receber por aqui! Para começarmos, conta pra mim: você tem interesse em consórcio de carro, casa, moto, serviços, alavancagem ou agro?`,
      intent: 'outro',
      ready_for_meeting: false,
      profile: p,
    };
  }

  if (!p.value) {
    return {
      reply: `${CATEGORY_REPLY[p.category]}`,
      intent: p.category,
      ready_for_meeting: false,
      profile: p,
    };
  }

  if (!p.plazo) {
    return {
      reply: `Perfeito, ${withName}! E em quanto tempo você gostaria de pagar? Temos planos de 30 a 200 meses — qual prazo combina melhor com você?`,
      intent: p.category,
      ready_for_meeting: false,
      profile: p,
    };
  }

  if (!p.whatsapp) {
    return {
      reply: `Excelente, ${withName}! Resumindo: ${p.category === 'alavancagem' ? 'você quer alavancar' : p.category === 'servicos' ? 'você quer um plano de serviços' : `você quer um consórcio de ${p.category}`} de ${p.value} em ${p.plazo} meses. Para eu agendar a reunião com o consultor, me passa seu WhatsApp com DDD?`,
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
  const knowledge = String(c.knowledge || '').trim().slice(0, 20000);
  const lines = [
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
    'REGRA DE OURO: o objetivo é agendar uma reunião. Conduza em etapas, UMA pergunta por vez, e SEMPRE nessa ordem:',
    '0) ANTES de tudo, peça o nome da pessoa.',
    '1) descubra a categoria de interesse;',
    '2) descubra o valor aproximado do bem/serviço;',
    '3) descubra o prazo desejado em meses;',
    '4) peça o WhatsApp com DDD;',
    '5) só então sinalize que está pronto para agendar.',
    '',
    'SOBRE O NOME: quando você perguntar "qual é o seu nome?" e a pessoa responder apenas com um nome',
    'ou sobrenome (ex.: "João" ou "Maria Silva"), SEM usar "sou" ou "me chamo", considere isso como o nome dela.',
    'Não pergunte de novo nem trate como resposta a outra pergunta.',
    '',
    'SOBRE INFORMAÇÕES (IMPORTANTE — NUNCA DÊ INFORMAÇÃO FALSA):',
    '- Responda apenas com base na "BASE DE CONHECIMENTO" abaixo e no que a pessoa informou.',
    '- Nunca invente números: taxa de administração, prazos, valores mínimos de parcela, regras de contemplação,',
    '  percentuais ou condições que não estejam na base de conhecimento.',
    '- Se não souber a resposta com certeza, diga algo como: "Isso eu prefiro confirmar com o(a) consultor(a),',
    '  mas posso deixar sua reunião agendada para ele(a) te explicar tudo direitinho."',
    '- Fato geral permitido: consórcio não cobra juros (apenas taxa de administração) e não exige entrada.',
    '',
    'SOBRE A CONVERSA:',
    '- Responda sempre em português do Brasil, de forma natural, calorosa e humana. NADA de respostas de robô.',
    '- Use frases curtas (1 a 3). Faça uma pergunta por vez.',
    '- Nunca invente nome, telefone, valores ou informações que a pessoa não informou.',
    '- Se a pessoa responder algo fora do tema, conduza de volta com empatia.',
    '',
  ];
  if (knowledge) {
    lines.push('BASE DE CONHECIMENTO DO CONSULTOR (use somente isto para falar de condições, taxas, prazos e produtos):');
    lines.push(knowledge);
    lines.push('');
  }
  lines.push(
    `Contexto sobre ${safe(identity.name, 'o consultor')}: ${safe(c.about && c.about.bio, '')}`,
    '',
    'SAÍDA: responda APENAS com um objeto JSON, sem markdown, neste formato:',
    '{"reply":"sua mensagem","intent":"carro|casa|moto|servicos|alavancagem|agro|outro","ready_for_meeting":false,"profile":{"name":"","whatsapp":"","value":"","plazo":""}}',
    '- "reply": a mensagem que será exibida ao visitante.',
    '- "intent": a categoria detectada.',
    '- "ready_for_meeting": true SOMENTE quando nome, whatsapp e intenção já foram informados.',
    '- "profile": preencha apenas campos que a pessoa já informou (não invente).'
  );
  return lines.join('\n');
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

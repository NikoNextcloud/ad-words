const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = { platform: 'facebook', keywords: [] };
const topic = $('#topic'), locationInput = $('#location'), business = $('#business');
const benefit = $('#benefit'), contact = $('#contact'), manual = $('#manualKeywords');

const clean = (value) => String(value || '').replace(/^\s*[+↑]+\s*/, '').replace(/\s+/g, ' ').trim();
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const unique = (items) => [...new Set(items.map(clean).filter(v => v.length > 1))];

function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2300);
}

function trendsUrl() {
  const q = topic.value.trim() || 'Печат на винил';
  return `https://trends.google.com/trends/explore?geo=BG&q=${encodeURIComponent(q)}&hl=bg`;
}

function updateLinks() {
  const q = topic.value.trim() || 'Печат на винил';
  $('#trendsLink').href = trendsUrl();
  $('#searchLink').href = `https://www.google.com/search?hl=bg&gl=bg&q=${encodeURIComponent(q)}`;
}

function localIdeas(q) {
  const city = locationInput.value.trim();
  return unique([
    q, `${q} цена`, `${q} цени`, `${q} по поръчка`, `${q} онлайн`,
    `${q} за реклама`, `качествен ${q.toLowerCase()}`, `бърз ${q.toLowerCase()}`,
    city && `${q} ${city}`, city && `${q} цена ${city}`
  ]);
}

function scoreKeywords(words, importedScores = {}) {
  const q = topic.value.toLowerCase().trim();
  state.keywords = unique(words).slice(0, 30).map((text, index) => {
    const raw = importedScores[text];
    let score = Number.isFinite(raw) ? raw : Math.max(48, 92 - index * 4);
    if (text.toLowerCase() === q) score = Math.max(score, 94);
    if (/цена|цени|поръч|купи|оферт/.test(text.toLowerCase())) score = Math.min(99, score + 5);
    return { text, score: Math.round(Math.max(1, Math.min(100, score))) };
  }).sort((a,b) => b.score - a.score);
  renderKeywords();
}

function renderKeywords() {
  const box = $('#keywordResults'), list = $('#keywordList');
  list.innerHTML = state.keywords.map((k,i) => `<span class="keyword-chip">${escapeHtml(k.text)} <b>${k.score}</b><button data-remove="${i}" aria-label="Премахни">×</button></span>`).join('');
  $('#keywordCount').textContent = `${state.keywords.length} фрази`;
  box.classList.toggle('hidden', !state.keywords.length);
  list.onclick = e => { const i = e.target.dataset.remove; if (i !== undefined) { state.keywords.splice(Number(i),1); renderKeywords(); } };
}

function startResearch() {
  if (!topic.value.trim()) return toast('Напиши тема за проучване.');
  updateLinks();
  manual.value = localIdeas(topic.value.trim()).slice(1,7).join(', ');
  scoreKeywords(localIdeas(topic.value.trim()));
  $('#step2').classList.add('active');
  $('#step2').scrollIntoView({behavior:'smooth', block:'start'});
  toast('Проучването е подготвено. Отвори Google Trends.');
  save();
}

function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const words = [], scores = {};
  for (const line of lines) {
    if (/^(category|week|day|month|topic|query|заявка|тема|категория|седмица)/i.test(line)) continue;
    const cells = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => clean(c.replace(/^\"|\"$/g,'')));
    if (!cells.length) continue;
    const possibleText = cells.find(c => c && !/^\d{4}-\d{2}/.test(c) && !/^\d+(?:[.,]\d+)?%?$/.test(c));
    if (!possibleText || /^(top|rising|related queries|interest over time|note)/i.test(possibleText)) continue;
    const numberCell = cells.find(c => /^\d+(?:[.,]\d+)?%?$/.test(c));
    const n = numberCell ? parseFloat(numberCell.replace(',','.')) : NaN;
    words.push(possibleText);
    if (Number.isFinite(n)) scores[possibleText] = n > 100 ? 100 : n;
  }
  return { words: unique(words), scores };
}

function analyzeManual() {
  const values = manual.value.split(/[\n,;]+/).map(clean).filter(Boolean);
  if (!values.length) return toast('Добави поне една свързана фраза.');
  scoreKeywords([topic.value, ...values]);
  $('#step3').classList.add('active');
  toast('Ключовите думи са анализирани.');
  save();
}

function hashtag(text) {
  return '#' + text.toLowerCase().replace(/[^а-яa-z0-9]+/gi,'').slice(0,28);
}

const toneText = {
  selling: ['Готови ли сте да бъдете забелязани?', 'Направете рекламата си по-видима.', 'Превърнете идеята си в реклама, която работи.'],
  professional: ['Професионално решение за вашия бизнес.', 'Качество, на което можете да разчитате.', 'Представете бизнеса си по най-добрия начин.'],
  friendly: ['Имаме чудесна идея за вас!', 'Нека направим нещо впечатляващо заедно.', 'Вашата идея заслужава да бъде видяна.'],
  premium: ['Отличителна визия. Без компромис.', 'Когато детайлът има значение.', 'Премиум присъствие за вашата марка.']
};

function buildPosts() {
  const q = clean(topic.value);
  if (!q) return toast('Първо добави тема.');
  if (!state.keywords.length) scoreKeywords(localIdeas(q));
  const keys = state.keywords.slice(0,5).map(k => k.text);
  const city = clean(locationInput.value), name = clean(business.value), plus = clean(benefit.value);
  const cta = clean(contact.value) || 'Пишете ни на лично съобщение за оферта.';
  const intros = toneText[$('#tone').value];
  const where = city ? ` в ${city}` : '';
  const who = name ? `${name} предлага` : 'Предлагаме';
  const advantages = plus ? ` Нашето предимство: ${plus}.` : ' Получавате внимание към детайла и решение според вашите нужди.';
  const tags = unique([q, ...keys.slice(0,3), city, 'българскибизнес']).filter(Boolean).map(hashtag).join(' ');
  const emoji = state.platform === 'instagram';
  const data = [
    {label:'ВАРИАНТ 1 · ДИРЕКТЕН', title:intros[0], text:`${emoji?'✨ ':''}${intros[0]}\n\n${who} ${q.toLowerCase()}${where} за реклама, събития и индивидуални проекти.${advantages}\n\n✓ Ясна комуникация\n✓ Изработка според заданието\n✓ Индивидуална оферта\n\n${cta}\n\n${tags}`},
    {label:'ВАРИАНТ 2 · ПОЛЗИ', title:`${q} с ясен резултат`, text:`${emoji?'📣 ':''}Търсите ${q.toLowerCase()}${where}?\n\n${intros[1]} ${plus ? `Залагаме на ${plus.toLowerCase()}` : 'Работим прецизно и според конкретната ви идея'}, за да получите резултат, който представя бизнеса ви убедително.\n\nПодходящо за витрини, кампании, събития и външна реклама.\n\n${cta}\n\n${tags}`},
    {label:'ВАРИАНТ 3 · РАЗГОВОРЕН', title:'Имаш идея? Нека я покажем.', text:`${emoji?'💡 ':''}${intros[2]}\n\nРазкажете ни какво искате да постигнете, а ние ще предложим подходящ вариант за ${q.toLowerCase()}${where}.${advantages}\n\nИмате размери или готов файл? Изпратете ги и ще подготвим персонална оферта.\n\n${cta}\n\n${tags}`}
  ];
  $('#postsGrid').innerHTML = data.map((p,i) => `<article class="post-card"><span class="post-label">${p.label}</span><h4>${escapeHtml(p.title)}</h4><div class="post-text">${escapeHtml(p.text)}</div><button class="copy-btn" data-copy="${i}">Копирай текста</button></article>`).join('');
  $('#postsGrid').classList.remove('hidden'); $('#postsEmpty').classList.add('hidden');
  $$('.copy-btn').forEach((btn,i) => btn.onclick = async () => { await navigator.clipboard.writeText(data[i].text); toast('Текстът е копиран.'); });
  $('#step3').classList.add('active'); save();
}

function save() {
  localStorage.setItem('trendcraft-bg', JSON.stringify({topic:topic.value,location:locationInput.value,business:business.value,benefit:benefit.value,contact:contact.value,manual:manual.value,keywords:state.keywords}));
}
function load() {
  try { const d=JSON.parse(localStorage.getItem('trendcraft-bg')); if(!d)return; topic.value=d.topic||topic.value;locationInput.value=d.location||'';business.value=d.business||'';benefit.value=d.benefit||'';contact.value=d.contact||'';manual.value=d.manual||'';state.keywords=d.keywords||[];renderKeywords(); } catch {}
  updateLinks();
}

$('#researchBtn').onclick = startResearch;
$('#demoBtn').onclick = () => { topic.value='Печат на винил';locationInput.value='София';business.value='Print Studio';benefit.value='бърза изработка и наситени цветове';contact.value='Пишете ни на лично за безплатна оферта';startResearch(); };
$('#analyzeManualBtn').onclick = analyzeManual;
$('#generateBtn').onclick = buildPosts;
topic.addEventListener('input', updateLinks);
$$('[data-scroll]').forEach(b => b.onclick=()=>document.getElementById(b.dataset.scroll).scrollIntoView({behavior:'smooth'}));
$$('.platform').forEach(btn => btn.onclick=()=>{$$('.platform').forEach(b=>b.classList.remove('active'));btn.classList.add('active');state.platform=btn.dataset.platform;});

const fileInput = $('#csvFile'), drop = $('#dropzone');
async function readFile(file) {
  if (!file || !file.name.toLowerCase().endsWith('.csv')) return toast('Избери CSV файл от Google Trends.');
  if (file.size > 5*1024*1024) return toast('Файлът е по-голям от 5 MB.');
  const parsed = parseCSV(await file.text());
  if (!parsed.words.length) return toast('Не открих ключови фрази. Добави ги в полето отдолу.');
  manual.value = parsed.words.join(', '); scoreKeywords([topic.value,...parsed.words],parsed.scores);
  $('#step3').classList.add('active'); toast(`Импортирани са ${parsed.words.length} фрази.`); save();
}
fileInput.onchange = e => readFile(e.target.files[0]);
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));
drop.addEventListener('drop',e=>readFile(e.dataTransfer.files[0]));
load();

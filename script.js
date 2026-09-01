/* =========================================================
   ROLETINHA — app principal
   Dados dos produtos ficam em data.js (CATALOGO + CATEGORIAS_ROLETA).
   ========================================================= */

// ---------- "caixinha de recados" (fácil de editar / adicionar frases) ----------
const MENSAGENS = [
  "espero que você tenha um dia tão lindo quanto você. ❤️",
  "o app decidiu, mas eu já sabia que você ficaria linda. 😌❤️",
  "só mais um detalhe pra deixar o seu dia mais bonito.",
  "escolhido com carinho (e um pouquinho de sorte).",
  "combina com você, como quase tudo combina.",
];

// ---------- easter eggs (1 em cada 7 giros) ----------
const EASTER_EGGS = [
  "🎵 um pedacinho daquela música que você ama tocando só pra você.",
  "✨ uma chuvinha de confete só porque você merece.",
  "💌 lembrete surpresa: você é o meu lugar favorito.",
  "🎶 hoje o giro veio com trilha sonora especial — a sua favorita.",
];

// ---------- agrupamento das roletas por parte do corpo (menu) ----------
const GRUPOS = {
  mao: ["anel", "esmalte", "esmalte_efeito"],
  rosto: ["boca", "olhos", "blush", "base", "cilios"],
};

// categorias que entram no combo do dia — esmalte e esmalte efeito somados numa só roda
const COMBO_CATEGORIAS = [
  { key: "cilios", label: "cílios", roletas: ["cilios"] },
  { key: "boca", label: "boca", roletas: ["boca"] },
  { key: "esmalte", label: "esmalte", roletas: ["esmalte", "esmalte_efeito"] },
  { key: "splash", label: "body splash", roletas: ["splash"] },
  { key: "blush", label: "blush", roletas: ["blush"] },
  { key: "base", label: "base/corretivo", roletas: ["base"] },
  { key: "anel", label: "anel", roletas: ["anel"] },
  { key: "olhos", label: "olhos", roletas: ["olhos"] },
];

// cor-base por roleta, só pra pintar as fatias da roda (não é dado do produto — cor real fica em branco no catálogo)
const COR_BASE_ROLETA = {
  boca: "#D1495B",
  splash: "#3FBFA0",
  olhos: "#5C6E91",
  esmalte: "#B5679D",
  esmalte_efeito: "#7C5CBF",
  blush: "#E8998D",
  anel: "#C9A24B",
  base: "#B08968",
  cilios: "#4C7A72",
};

// gera uma variação de tom a partir da cor-base, pra distinguir fatias dentro da mesma roleta
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function shadeForIndex(baseHex, index) {
  const { r, g, b } = hexToRgb(baseHex);
  // alterna entre clarear e escurecer levemente, em ciclos, pra ter variedade sem perder a identidade da cor
  const cycle = index % 6;
  const factor = [0, 0.14, -0.14, 0.26, -0.26, 0.08][cycle];
  const mix = factor >= 0
    ? { r: r + (255 - r) * factor, g: g + (255 - g) * factor, b: b + (255 - b) * factor }
    : { r: r * (1 + factor), g: g * (1 + factor), b: b * (1 + factor) };
  return rgbToHex(mix.r, mix.g, mix.b);
}

// ---------- estado ----------
const state = {
  mood: "aleatorio",
  spinCount: 0, // contador global de giros nesta sessão (easter egg a cada 7)
  marcaFiltro: "", // "" = todas
  usados: {}, // { categoriaRoleta: Set(ids já sorteados) } — não repete até resetar
};

// ---------- salvar/carregar os "já sorteados" no navegador (localStorage) ----------
// assim a roleta lembra o que já saiu mesmo depois de fechar e abrir o app de novo.
const STORAGE_KEY = "roletinha_usados_v1";

function carregarUsadosSalvos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.keys(parsed).forEach((catKey) => {
      state.usados[catKey] = new Set(parsed[catKey]);
    });
  } catch (e) {
    // localStorage indisponível (ex: modo privado) — o app segue funcionando normal,
    // só não vai lembrar os "já sorteados" entre uma visita e outra
  }
}

function salvarUsados() {
  try {
    const plain = {};
    Object.keys(state.usados).forEach((catKey) => {
      plain[catKey] = Array.from(state.usados[catKey]);
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plain));
  } catch (e) {
    // sem espaço ou sem permissão de localStorage — ignora silenciosamente
  }
}

carregarUsadosSalvos();

function usedSetFor(categoriaRoleta) {
  if (!state.usados[categoriaRoleta]) state.usados[categoriaRoleta] = new Set();
  return state.usados[categoriaRoleta];
}

// remove do pool os itens já sorteados nesta roleta; se todos já saíram, recicla (reseta) sozinho
function aplicarNaoRepeticao(pool, categoriaRoleta) {
  const usados = usedSetFor(categoriaRoleta);
  const restantes = pool.filter((item) => !usados.has(item.id));
  if (restantes.length === 0 && pool.length > 0) {
    usados.clear(); // já usou tudo — recomeça o ciclo automaticamente
    salvarUsados();
    return pool;
  }
  return restantes;
}

function marcarComoUsado(item, categoriaRoleta) {
  usedSetFor(categoriaRoleta).add(item.id);
  salvarUsados();
}

function resetarUsados(categoriaRoleta) {
  usedSetFor(categoriaRoleta).clear();
  salvarUsados();
}

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function poolForMood(list) {
  if (state.mood === "aleatorio") return list;
  const filtrado = list.filter(
    (item) => item.climas.length === 0 || item.climas.includes(state.mood)
  );
  return filtrado.length ? filtrado : list; // nunca deixa a roleta vazia
}

function isEasterEggTurn() {
  state.spinCount += 1;
  if (state.spinCount % 7 === 0) return true;
  return false;
}

function showScreen(id) {
  document.querySelectorAll("[data-screen]").forEach((el) => {
    el.hidden = el.id !== id;
  });
}

function moodLabel(mood) {
  return { aleatorio: "aleatório", date: "date", trabalho: "trabalho", casa: "em casa" }[mood];
}

function itensDaRoleta(categoriaRoleta) {
  return CATALOGO.filter((item) => item.categoriaRoleta === categoriaRoleta && item.ativo !== false);
}

// linhas de detalhe de um produto (marca, se houver + categoria da roleta; função/combina só se preenchidos)
function itemDetailLines(item) {
  const lines = [];
  if (item.marca) lines.push(`Marca: ${item.marca}`);
  lines.push(`Categoria: ${CATEGORIAS_ROLETA[item.categoriaRoleta].label}`);
  if (item.funcao) lines.push(item.funcao);
  if (item.combina) lines.push(item.combina);
  return lines;
}

// ---------- música de fundo (toca sozinha ao abrir o app, com uma playlist de até 10 músicas —
// ver assets/musicas/LEIA-ME.txt) ----------
const PLAYLIST_TAMANHO = 10;
const PLAYLIST_CAMINHOS = Array.from(
  { length: PLAYLIST_TAMANHO },
  (_, i) => `assets/musicas/musica-${String(i + 1).padStart(2, "0")}.mp3`
);

const audioBg = $("audio-bg");
const audioEgg = $("audio-egg");
let playlistEmbaralhada = [];
let playlistIndex = -1;

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// tenta tocar a próxima faixa da playlist; se essa faixa não existir (ainda não foi
// adicionada), pula pra próxima sozinho, sem travar nem dar erro visível.
function tocarProximaFaixa(tentativas = 0) {
  if (tentativas >= PLAYLIST_CAMINHOS.length) return; // nenhuma música adicionada ainda — tudo bem, segue sem som
  playlistIndex++;
  if (playlistIndex >= playlistEmbaralhada.length) {
    playlistEmbaralhada = embaralhar(PLAYLIST_CAMINHOS);
    playlistIndex = 0;
  }
  audioBg.src = playlistEmbaralhada[playlistIndex];
  audioBg.play().catch(() => tocarProximaFaixa(tentativas + 1));
}

function iniciarMusicaDeFundo() {
  playlistEmbaralhada = embaralhar(PLAYLIST_CAMINHOS);
  playlistIndex = -1;
  tocarProximaFaixa();
}

audioBg.addEventListener("ended", () => tocarProximaFaixa());

// assim que a página abre, já tenta tocar sozinho. navegadores costumam bloquear som
// automático sem interação do usuário — nesse caso, o botão de play do player (topo do
// app) deixa a pessoa iniciar manualmente com um toque.
iniciarMusicaDeFundo();

// ---------- player fixo no topo: play/pausa e pular música ----------
const playerToggleBtn = $("player-toggle");
const playerNextBtn = $("player-next");

audioBg.addEventListener("play", () => {
  playerToggleBtn.textContent = "⏸";
  playerToggleBtn.setAttribute("aria-label", "Pausar música");
});

audioBg.addEventListener("pause", () => {
  playerToggleBtn.textContent = "▶";
  playerToggleBtn.setAttribute("aria-label", "Tocar música");
});

playerToggleBtn.addEventListener("click", () => {
  if (audioBg.paused) {
    if (audioBg.src) audioBg.play().catch(() => {});
    else iniciarMusicaDeFundo();
  } else {
    audioBg.pause();
  }
});

playerNextBtn.addEventListener("click", () => {
  tocarProximaFaixa();
});

// easter egg: pausa a música de fundo, toca a faixa especial, e quando ela termina
// a música de fundo volta sozinha de onde parou.
function tocarEasterEgg() {
  audioBg.pause();
  audioEgg.currentTime = 0;
  audioEgg.play().catch(() => {});
}

audioEgg.addEventListener("ended", () => {
  if (audioBg.src) audioBg.play().catch(() => {});
});

// ---------- mood chips (tela inicial) ----------
document.querySelectorAll(".mood-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".mood-chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    state.mood = chip.dataset.mood;
  });
});

// ---------- saudação ----------
const SAUDACOES = ["bom dia, meu amor", "oi, gata", "e aí, linda", "boa, meu bem"];
$("greeting-text").textContent = pickRandom(SAUDACOES);

/* =========================================================
   NAVEGAÇÃO — home → submenu (mão/rosto) → roleta específica
   ========================================================= */

function renderSubmenu(grupoKey, containerId) {
  const container = $(containerId);
  container.innerHTML = "";
  GRUPOS[grupoKey].forEach((catKey) => {
    const meta = CATEGORIAS_ROLETA[catKey];
    const count = itensDaRoleta(catKey).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "action-tile";
    btn.dataset.openRoleta = catKey;
    btn.innerHTML = `
      <span class="action-icon" aria-hidden="true">
        <img src="assets/icons/${catKey}.png" alt="" onerror="this.style.display='none'">
        <span class="icon-fallback">${meta.emoji}</span>
      </span>
      <span class="action-text">
        <strong>${meta.label.toLowerCase()}</strong>
        <small>${count} produtos</small>
      </span>
      <span class="action-arrow" aria-hidden="true">›</span>
    `;
    btn.addEventListener("click", () => openRoulette(catKey));
    container.appendChild(btn);
  });
}

document.querySelectorAll("[data-open-group]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const grupo = btn.dataset.openGroup;
    if (grupo === "mao") {
      renderSubmenu("mao", "submenu-mao-list");
      showScreen("screen-submenu-mao");
    } else if (grupo === "rosto") {
      renderSubmenu("rosto", "submenu-rosto-list");
      showScreen("screen-submenu-rosto");
    }
  });
});

document.querySelectorAll("[data-open-roleta]").forEach((btn) => {
  btn.addEventListener("click", () => openRoulette(btn.dataset.openRoleta));
});

document.querySelectorAll("[data-open]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.open === "combo") openCombo();
  });
});

document.querySelectorAll("[data-back-home]").forEach((btn) => {
  btn.addEventListener("click", () => showScreen("screen-home"));
});

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!audioEgg.paused) {
      audioEgg.pause();
      audioEgg.currentTime = 0;
      if (audioBg.src) audioBg.play().catch(() => {});
    }
    showScreen("screen-home");
  });
});

/* =========================================================
   ROLETA DE VERDADE — desenha as fatias coloridas por item
   e gira fisicamente até parar no item sorteado.
   ========================================================= */

function buildWheelGradient(pool, categoriaRoleta) {
  const n = pool.length;
  const slice = 360 / n;
  const base = COR_BASE_ROLETA[categoriaRoleta] || "#178C6B";
  let stops = [];
  pool.forEach((item, i) => {
    const start = (slice * i).toFixed(2);
    const end = (slice * (i + 1)).toFixed(2);
    stops.push(`${shadeForIndex(base, i)} ${start}deg ${end}deg`);
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function polar(cx, cy, radius, angleDeg) {
  const rad = (Math.PI / 180) * angleDeg;
  return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) };
}

// duas tonalidades alternadas por fatia — visual clássico de roleta, mais limpo que um degradê cíclico
function paletteForBase(baseHex) {
  const { r, g, b } = hexToRgb(baseHex);
  const light = rgbToHex(r + (255 - r) * 0.14, g + (255 - g) * 0.14, b + (255 - b) * 0.14);
  const dark = rgbToHex(r * 0.72, g * 0.72, b * 0.72);
  return [light, dark];
}

// roleta "de verdade": desenha cada fatia com a cor do item + o nome dele escrito nela,
// com o texto curvado acompanhando o arco da fatia (como uma roleta de prêmios de verdade).
// o mesmo ângulo usado aqui pra desenhar é o mesmo usado em spinWheelEl pra girar,
// então o que aparece embaixo do ponteiro é sempre exatamente o item sorteado.
function buildWheelSVG(pool, categoriaRoleta) {
  const n = pool.length;
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const slice = 360 / n;
  const base = COR_BASE_ROLETA[categoriaRoleta] || "#178C6B";
  const [colorA, colorB] = paletteForBase(base);

  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colorB}" />`;

  // caso raro: sobrou só 1 produto no pool (ex: filtro de marca bem restrito) — a fatia é o círculo inteiro
  if (n === 1) {
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colorA}" />`;
    svg += `<text x="${cx}" y="${cy + 5}" font-size="15" fill="#fff" text-anchor="middle" font-family="'Quicksand', sans-serif" font-weight="700" style="paint-order: stroke; stroke: rgba(0,0,0,0.35); stroke-width: 0.8px;">${escapeXml(pool[0].nome)}</text>`;
    svg += `</svg>`;
    return svg;
  }

  // tamanho de fonte por quantidade de itens (padrão usado por roletas de sorteio reais:
  // tamanho fixo por roleta + texto radial do centro até a borda, não um cálculo por fatia)
  const fontSize = n <= 8 ? 17 : n <= 16 ? 13.5 : n <= 30 ? 10.5 : n <= 55 ? 8 : 6.3;
  const maxChars = n <= 8 ? 24 : n <= 16 ? 19 : n <= 30 ? 15 : n <= 55 ? 12 : 10;
  const insetRadius = r * 0.22; // começa logo depois do miolo (hub) da roleta
  const outerRadius = r * 0.95; // vai quase até a borda

  pool.forEach((item, i) => {
    const start = slice * i;
    const end = slice * (i + 1);
    const p1 = polar(cx, cy, r, start);
    const p2 = polar(cx, cy, r, end);
    const largeArc = slice > 180 ? 1 : 0;
    const color = i % 2 === 0 ? colorA : colorB;

    svg += `<path d="M${cx},${cy} L${p1.x.toFixed(2)},${p1.y.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${p2.x.toFixed(2)},${p2.y.toFixed(2)} Z" fill="${color}" stroke="rgba(255,255,255,0.28)" stroke-width="0.8" />`;

    // texto radial: sempre na mesma direção, do miolo até perto da borda,
    // seguindo o raio da própria fatia — sem inverter em nenhum lado da roleta.
    const mid = start + slice / 2;
    let label = item.nome;
    if (label.length > maxChars) label = `${label.slice(0, maxChars - 1)}…`;

    const theta = mid - 90;

    svg += `<text x="${(cx + insetRadius).toFixed(2)}" y="${cy.toFixed(2)}" transform="rotate(${theta.toFixed(2)} ${cx} ${cy})" font-size="${fontSize}" fill="#fff" text-anchor="start" dominant-baseline="middle" font-family="'Nunito Sans', sans-serif" font-weight="800" style="paint-order: stroke; stroke: rgba(0,0,0,0.42); stroke-width: ${(fontSize * 0.1).toFixed(2)}px;">${escapeXml(label)}</text>`;
  });

  // aro decorativo fino perto da borda, dá um acabamento mais "roleta de prêmio"
  svg += `<circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" />`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${r - 9}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1" />`;

  svg += `</svg>`;
  return svg;
}

// gira em duas fases: rápido e constante por boa parte do tempo, depois desacelera de
// verdade só perto do fim — como uma roleta física de verdade indo parando aos poucos.
function animarGiroEmDuasFases(el, valorFinal, durationMs, formatarTransform, fasesRapidaPct = 0.7) {
  const duracaoRapida = durationMs * fasesRapidaPct;
  const duracaoFreio = durationMs * (1 - fasesRapidaPct);
  const valorNaTrocaDeFase = valorFinal * fasesRapidaPct;

  el.style.transition = "none";
  el.style.transform = formatarTransform(0);
  // força reflow pra garantir que o reset acima seja aplicado antes de animar
  void el.offsetWidth;

  requestAnimationFrame(() => {
    el.style.transition = `transform ${duracaoRapida}ms linear`;
    el.style.transform = formatarTransform(valorNaTrocaDeFase);
  });

  setTimeout(() => {
    el.style.transition = `transform ${duracaoFreio}ms cubic-bezier(0.13, 0.85, 0.22, 1)`;
    el.style.transform = formatarTransform(valorFinal);
  }, duracaoRapida);
}

function spinWheelEl(wheelEl, pool, selectedIndex, durationMs, categoriaRoleta, redraw) {
  const n = pool.length;
  const slice = 360 / n;
  // ângulo pra o ponteiro (fixo no topo) cair no meio da fatia sorteada
  const landingAngle = 360 - (selectedIndex * slice + slice / 2);
  const extraSpins = 360 * (12 + Math.floor(Math.random() * 4)); // 12-15 voltas completas — giro bem mais longo
  const finalAngle = extraSpins + landingAngle;

  redraw();
  animarGiroEmDuasFases(wheelEl, finalAngle, durationMs, (v) => `rotate(${v}deg)`);
}

/* =========================================================
   ESTEIRA DE NOMES — alternativa à roda pra roletas com muitos
   produtos (o texto não cabe legível numa roda com 80+ fatias).
   Um "carretel" vertical de nomes corre e para exatamente no
   item sorteado, igual um caça-níquel.
   ========================================================= */

// acima desse número de produtos, a roleta vira uma esteira de nomes em vez de uma roda.
// fácil de ajustar depois de decidir quais categorias realmente precisam disso.
const REEL_THRESHOLD = 40;

function usaEsteira(n) {
  return n > REEL_THRESHOLD;
}

const REEL_ROW_HEIGHT = 46;
const REEL_ROW_HEIGHT_MINI = 30;
const REEL_REPEATS = 10; // mais voltas na lista, pra sustentar um giro de 15s

function buildReelRows(pool, rowClass = "reel-row") {
  let html = "";
  for (let loop = 0; loop < REEL_REPEATS; loop++) {
    pool.forEach((item) => {
      html += `<div class="${rowClass}">${escapeXml(item.nome)}</div>`;
    });
  }
  return html;
}

function drawReelIdle(trackEl, pool, rowHeight = REEL_ROW_HEIGHT, rowClass = "reel-row") {
  trackEl.innerHTML = buildReelRows(pool, rowClass);
  trackEl.style.transition = "none";
  // começa já mostrando uma volta "no meio" da lista, não sempre do primeiro item
  const meio = Math.floor((REEL_REPEATS / 2) * pool.length * rowHeight);
  trackEl.style.transform = `translateY(-${meio}px)`;
}

function spinReelEl(trackEl, pool, selectedIndex, durationMs, rowHeight = REEL_ROW_HEIGHT, windowHeight = 230, rowClass = "reel-row") {
  trackEl.innerHTML = buildReelRows(pool, rowClass);

  const n = pool.length;
  const targetLoop = REEL_REPEATS - 2; // deixa uma volta de sobra depois do alvo
  const targetRow = targetLoop * n + selectedIndex;
  const finalTranslate = targetRow * rowHeight + rowHeight / 2 - windowHeight / 2;

  animarGiroEmDuasFases(trackEl, finalTranslate, durationMs, (v) => `translateY(-${v}px)`);
}

/* =========================================================
   FILTRO POR MARCA (dentro de cada roleta)
   ========================================================= */

function getBrands(categoriaRoleta) {
  const seen = [];
  itensDaRoleta(categoriaRoleta).forEach((item) => {
    if (item.marca && !seen.includes(item.marca)) seen.push(item.marca);
  });
  return seen;
}

function renderMarcaChips(categoriaRoleta) {
  const wrap = $("marca-chips");
  wrap.innerHTML = "";
  const brands = getBrands(categoriaRoleta);

  if (brands.length === 0) {
    // roleta sem marcas identificáveis (ex: esmalte, anel) — não faz sentido mostrar filtro de marca
    $("marca-filter-group").hidden = true;
    return;
  }
  $("marca-filter-group").hidden = false;

  const todasBtn = document.createElement("button");
  todasBtn.type = "button";
  todasBtn.className = "filter-chip filter-chip--all is-active";
  todasBtn.dataset.marca = "";
  todasBtn.textContent = "Todas";
  wrap.appendChild(todasBtn);

  brands.forEach((marca) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-chip";
    btn.dataset.marca = marca;
    btn.textContent = marca;
    wrap.appendChild(btn);
  });

  wrap.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      wrap.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      state.marcaFiltro = chip.dataset.marca;
      updateFilterUI();
    });
  });
}

function getFilteredPool() {
  let pool = poolForMood(itensDaRoleta(currentRoleta));
  if (state.marcaFiltro) pool = pool.filter((item) => item.marca === state.marcaFiltro);
  return pool;
}

// pool que a roleta realmente usa pra girar: filtrado + sem os já sorteados nesta rodada
function getSpinPool() {
  return aplicarNaoRepeticao(getFilteredPool(), currentRoleta);
}

function updateFilterUI() {
  const filtrado = getFilteredPool();
  const spinPool = aplicarNaoRepeticao(filtrado, currentRoleta);
  const filtrosAtivos = Boolean(state.marcaFiltro);

  $("filter-count").textContent = filtrosAtivos
    ? `${filtrado.length} ${filtrado.length === 1 ? "produto encontrado" : "produtos encontrados"}`
    : `${filtrado.length} produtos disponíveis`;

  $("filter-clear").hidden = !filtrosAtivos;

  const vazio = filtrado.length === 0;
  $("filter-empty").hidden = !vazio;
  const reelMode = usaEsteira(spinPool.length || filtrado.length);
  $("wheel-wrap").hidden = vazio || reelMode;
  $("reel-wrap").hidden = vazio || !reelMode;
  $("spin-btn").disabled = vazio;

  const usadosCount = filtrado.length - spinPool.length;
  $("usage-text").textContent =
    usadosCount > 0
      ? `${usadosCount} de ${filtrado.length} já sorteados nesta rodada`
      : `0 de ${filtrado.length} sorteados — roleta completa`;
  $("usage-reset").hidden = usadosCount === 0;

  return spinPool;
}

$("filter-clear").addEventListener("click", () => {
  state.marcaFiltro = "";
  document.querySelectorAll("#marca-chips .filter-chip").forEach((c, i) => {
    c.classList.toggle("is-active", i === 0);
  });
  updateFilterUI();
});

$("usage-reset").addEventListener("click", () => {
  resetarUsados(currentRoleta);
  const pool = updateFilterUI();
  if (usaEsteira(pool.length)) {
    drawReelIdle($("reel-track"), pool);
  } else {
    $("wheel-slices").innerHTML = buildWheelSVG(pool, currentRoleta);
    $("wheel").style.transform = "rotate(0deg)";
  }
});

/* =========================================================
   ROLETA (tela genérica pra qualquer categoria)
   ========================================================= */

let currentRoleta = "boca";
const SPIN_DURATION = 10000; // 10s — gira rápido e desacelera de verdade no final

function openRoulette(categoriaRoleta) {
  currentRoleta = categoriaRoleta;
  const meta = CATEGORIAS_ROLETA[categoriaRoleta];

  $("roulette-title").textContent = meta.label.toLowerCase();
  $("roulette-mood-pill").textContent = moodLabel(state.mood);
  $("wheel-hub-icon").textContent = meta.emoji;
  const hubImg = $("wheel-hub-img");
  hubImg.style.display = "";
  hubImg.src = `assets/icons/${categoriaRoleta}.png`;

  $("result").hidden = true;
  $("egg").hidden = true;
  $("spin-btn").hidden = false;
  $("spin-btn").disabled = false;
  $("spin-again-btn").hidden = true;

  state.marcaFiltro = "";
  renderMarcaChips(categoriaRoleta);
  const pool = updateFilterUI();

  if (usaEsteira(pool.length)) {
    $("wheel-wrap").hidden = true;
    $("reel-wrap").hidden = false;
    drawReelIdle($("reel-track"), pool);
  } else {
    $("reel-wrap").hidden = true;
    $("wheel-wrap").hidden = false;
    $("wheel-slices").innerHTML = buildWheelSVG(pool, categoriaRoleta);
    $("wheel").style.transform = "rotate(0deg)";
  }

  showScreen("screen-roulette");
}

$("spin-btn").addEventListener("click", () => spinRoulette());
$("spin-again-btn").addEventListener("click", () => spinRoulette());

function spinRoulette() {
  const pool = getSpinPool();
  if (pool.length === 0) return; // botão já fica desabilitado nesse caso, isso é só uma trava extra

  const reelMode = usaEsteira(pool.length);

  $("result").hidden = true;
  $("egg").hidden = true;
  $("wheel-wrap").hidden = reelMode;
  $("reel-wrap").hidden = !reelMode;
  $("spin-btn").hidden = true;
  $("spin-again-btn").hidden = true;

  const selectedIndex = Math.floor(Math.random() * pool.length);
  const sorteado = pool[selectedIndex];
  const eggTurn = isEasterEggTurn();

  if (reelMode) {
    spinReelEl($("reel-track"), pool, selectedIndex, SPIN_DURATION);
  } else {
    spinWheelEl($("wheel"), pool, selectedIndex, SPIN_DURATION, currentRoleta, () => {
      $("wheel-slices").innerHTML = buildWheelSVG(pool, currentRoleta);
    });
  }

  setTimeout(() => {
    $("spin-again-btn").hidden = false;
    marcarComoUsado(sorteado, currentRoleta);
    updateFilterUI(); // atualiza contador de usados (a visualização só é redesenhada no próximo giro)

    if (eggTurn) {
      tocarEasterEgg();
      $("egg-text").textContent = pickRandom(EASTER_EGGS);
      $("egg").hidden = false;
    } else {
      $("result-kicker").textContent = "hoje você vai usar";
      $("result-name").textContent = sorteado.nome;
      $("result-badge-img").src = `assets/icons/${currentRoleta}.png`;
      $("result-badge-img").style.display = "";
      $("result-badge-fallback").textContent = CATEGORIAS_ROLETA[currentRoleta].emoji;
      $("result-detail-lines").innerHTML = itemDetailLines(sorteado)
        .map((l) => `<p class="detail-line">${l}</p>`)
        .join("");
      $("result-message").textContent = pickRandom(MENSAGENS);
      $("result").hidden = false;
    }
  }, SPIN_DURATION);
}

/* =========================================================
   COMBO DO DIA (todas as categorias juntas — esmalte + esmalte
   efeito somados numa roda só)
   ========================================================= */

function comboPoolFor(combo) {
  let pool = [];
  combo.roletas.forEach((catKey) => {
    const subPool = poolForMood(itensDaRoleta(catKey));
    pool = pool.concat(aplicarNaoRepeticao(subPool, catKey));
  });
  return pool;
}

const COMBO_REEL_ROW_HEIGHT = 30;
const COMBO_REEL_WINDOW_HEIGHT = 90; // 3 linhas de 30px

function renderComboWheels() {
  const wrap = $("combo-wheels");
  wrap.innerHTML = "";
  COMBO_CATEGORIAS.forEach((combo) => {
    const iconKey = combo.roletas[0];
    const meta = CATEGORIAS_ROLETA[iconKey];
    const el = document.createElement("div");
    el.className = "reel-wrap reel-wrap--combo";
    el.id = `combo-wrap-${combo.key}`;
    el.innerHTML = `
      <p class="wheel-caption">${meta.emoji} ${combo.label}</p>
      <div class="reel-window reel-window--mini">
        <div class="reel-highlight reel-highlight--mini" aria-hidden="true"></div>
        <div class="reel-track" id="combo-reel-${combo.key}"></div>
      </div>
    `;
    wrap.appendChild(el);
  });
}

function openCombo() {
  $("combo-mood-pill").textContent = moodLabel(state.mood);
  renderComboWheels();

  COMBO_CATEGORIAS.forEach((combo) => {
    const pool = comboPoolFor(combo);
    drawReelIdle($(`combo-reel-${combo.key}`), pool, COMBO_REEL_ROW_HEIGHT, "reel-row reel-row--mini");
  });

  $("combo-result").hidden = true;
  $("combo-egg").hidden = true;
  $("combo-spin-btn").hidden = false;
  $("combo-spin-btn").disabled = false;
  $("combo-spin-again-btn").hidden = true;

  showScreen("screen-combo");
}

$("combo-spin-btn").addEventListener("click", () => spinCombo());
$("combo-spin-again-btn").addEventListener("click", () => spinCombo());

function spinCombo() {
  $("combo-result").hidden = true;
  $("combo-egg").hidden = true;
  $("combo-spin-btn").hidden = true;
  $("combo-spin-again-btn").hidden = true;

  const sorteios = COMBO_CATEGORIAS.map((combo) => {
    const pool = comboPoolFor(combo);
    const index = Math.floor(Math.random() * pool.length);
    return { combo, pool, index, item: pool[index] };
  });

  const eggTurn = isEasterEggTurn();

  sorteios.forEach(({ combo, pool, index }) => {
    spinReelEl(
      $(`combo-reel-${combo.key}`),
      pool,
      index,
      SPIN_DURATION,
      COMBO_REEL_ROW_HEIGHT,
      COMBO_REEL_WINDOW_HEIGHT,
      "reel-row reel-row--mini"
    );
  });

  setTimeout(() => {
    $("combo-spin-again-btn").hidden = false;
    sorteios.forEach(({ item }) => marcarComoUsado(item, item.categoriaRoleta));

    if (eggTurn) {
      tocarEasterEgg();
      $("combo-egg-text").textContent = pickRandom(EASTER_EGGS);
      $("combo-egg").hidden = false;
    } else {
      const resultWrap = $("combo-result");
      resultWrap.innerHTML = sorteios
        .map(
          ({ combo, item }) => `
        <div class="combo-card">
          <span class="combo-tag">${combo.label}</span>
          <h3 class="combo-name">${item.nome}</h3>
          <p class="combo-line">${itemDetailLines(item).join(" • ")}</p>
        </div>`
        )
        .join("");
      const msg = document.createElement("p");
      msg.className = "result-message";
      msg.textContent = pickRandom(MENSAGENS);
      resultWrap.appendChild(msg);
      resultWrap.hidden = false;
    }
  }, SPIN_DURATION);
}

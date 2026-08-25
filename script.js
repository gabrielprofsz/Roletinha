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
};

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

// ---------- áudio (opcional — ver assets/LEIA-ME.txt) ----------
const audioSpin = $("audio-spin");
const audioEgg = $("audio-egg");

function playSafe(audioEl) {
  if (!audioEl) return;
  audioEl.currentTime = 0;
  audioEl.play().catch(() => {
    /* sem arquivo de áudio ainda, ou navegador bloqueou autoplay — tudo bem, segue o app normalmente */
  });
}

function stopSafe(audioEl) {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
}

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
      <span class="action-icon" aria-hidden="true">${meta.emoji}</span>
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
    stopSafe(audioSpin);
    stopSafe(audioEgg);
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

function spinWheelEl(wheelEl, pool, selectedIndex, durationMs, categoriaRoleta) {
  const n = pool.length;
  const slice = 360 / n;
  // ângulo pra o ponteiro (fixo no topo) cair no meio da fatia sorteada
  const landingAngle = 360 - (selectedIndex * slice + slice / 2);
  const extraSpins = 360 * (5 + Math.floor(Math.random() * 2)); // 5-6 voltas completas
  const finalAngle = extraSpins + landingAngle;

  wheelEl.style.background = buildWheelGradient(pool, categoriaRoleta);
  wheelEl.style.transition = "none";
  wheelEl.style.transform = "rotate(0deg)";
  // força reflow pra garantir que o reset acima seja aplicado antes de animar
  void wheelEl.offsetWidth;

  requestAnimationFrame(() => {
    wheelEl.style.transition = `transform ${durationMs}ms cubic-bezier(.12,.67,.1,1)`;
    wheelEl.style.transform = `rotate(${finalAngle}deg)`;
  });
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
    $("filter-panel").hidden = true;
    return;
  }
  $("filter-panel").hidden = false;

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

function updateFilterUI() {
  const pool = getFilteredPool();
  const filtrosAtivos = Boolean(state.marcaFiltro);

  $("filter-count").textContent = filtrosAtivos
    ? `${pool.length} ${pool.length === 1 ? "produto encontrado" : "produtos encontrados"}`
    : `${pool.length} produtos disponíveis`;

  $("filter-clear").hidden = !filtrosAtivos;

  const vazio = pool.length === 0;
  $("filter-empty").hidden = !vazio;
  $("wheel-wrap").hidden = vazio;
  $("spin-btn").disabled = vazio;

  return pool;
}

$("filter-clear").addEventListener("click", () => {
  state.marcaFiltro = "";
  document.querySelectorAll("#marca-chips .filter-chip").forEach((c, i) => {
    c.classList.toggle("is-active", i === 0);
  });
  updateFilterUI();
});

/* =========================================================
   ROLETA (tela genérica pra qualquer categoria)
   ========================================================= */

let currentRoleta = "boca";
const SPIN_DURATION = 3400;

function openRoulette(categoriaRoleta) {
  currentRoleta = categoriaRoleta;
  const meta = CATEGORIAS_ROLETA[categoriaRoleta];

  $("roulette-title").textContent = meta.label.toLowerCase();
  $("roulette-mood-pill").textContent = moodLabel(state.mood);
  $("wheel-hub-icon").textContent = meta.emoji;

  $("result").hidden = true;
  $("egg").hidden = true;
  $("spin-btn").hidden = false;
  $("spin-btn").disabled = false;
  $("spin-again-btn").hidden = true;
  $("wheel-wrap").hidden = false;

  state.marcaFiltro = "";
  renderMarcaChips(categoriaRoleta);
  const pool = updateFilterUI();

  $("wheel").style.background = buildWheelGradient(pool, categoriaRoleta);
  $("wheel").style.transform = "rotate(0deg)";

  showScreen("screen-roulette");
}

$("spin-btn").addEventListener("click", () => spinRoulette());
$("spin-again-btn").addEventListener("click", () => spinRoulette());

function spinRoulette() {
  const pool = getFilteredPool();
  if (pool.length === 0) return; // botão já fica desabilitado nesse caso, isso é só uma trava extra

  $("result").hidden = true;
  $("egg").hidden = true;
  $("wheel-wrap").hidden = false;
  $("spin-btn").hidden = true;
  $("spin-again-btn").hidden = true;

  const selectedIndex = Math.floor(Math.random() * pool.length);
  const sorteado = pool[selectedIndex];
  const eggTurn = isEasterEggTurn();

  playSafe(audioSpin);
  spinWheelEl($("wheel"), pool, selectedIndex, SPIN_DURATION, currentRoleta);

  setTimeout(() => {
    stopSafe(audioSpin);
    $("spin-again-btn").hidden = false;

    if (eggTurn) {
      playSafe(audioEgg);
      $("egg-text").textContent = pickRandom(EASTER_EGGS);
      $("egg").hidden = false;
    } else {
      $("result-kicker").textContent = "hoje você vai usar";
      $("result-name").textContent = sorteado.nome;
      $("result-detail-lines").innerHTML = itemDetailLines(sorteado)
        .map((l) => `<p class="detail-line">${l}</p>`)
        .join("");
      $("result-message").textContent = pickRandom(MENSAGENS);
      $("result").hidden = false;
    }
  }, SPIN_DURATION);
}

/* =========================================================
   COMBO DO DIA (boca + body splash)
   ========================================================= */

function openCombo() {
  $("combo-mood-pill").textContent = moodLabel(state.mood);

  const poolM = poolForMood(itensDaRoleta("boca"));
  const poolS = poolForMood(itensDaRoleta("splash"));
  $("combo-wheel-1").style.background = buildWheelGradient(poolM, "boca");
  $("combo-wheel-1").style.transform = "rotate(0deg)";
  $("combo-wheel-2").style.background = buildWheelGradient(poolS, "splash");
  $("combo-wheel-2").style.transform = "rotate(0deg)";

  $("combo-result").hidden = true;
  $("combo-egg").hidden = true;
  document.querySelectorAll(".wheel-wrap--mini").forEach((w) => (w.hidden = false));
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

  const poolM = poolForMood(itensDaRoleta("boca"));
  const poolS = poolForMood(itensDaRoleta("splash"));
  const indexM = Math.floor(Math.random() * poolM.length);
  const indexS = Math.floor(Math.random() * poolS.length);
  const boca = poolM[indexM];
  const splash = poolS[indexS];
  const eggTurn = isEasterEggTurn();

  playSafe(audioSpin);
  spinWheelEl($("combo-wheel-1"), poolM, indexM, SPIN_DURATION, "boca");
  spinWheelEl($("combo-wheel-2"), poolS, indexS, SPIN_DURATION, "splash");

  setTimeout(() => {
    stopSafe(audioSpin);
    $("combo-spin-again-btn").hidden = false;

    if (eggTurn) {
      playSafe(audioEgg);
      $("combo-egg-text").textContent = pickRandom(EASTER_EGGS);
      $("combo-egg").hidden = false;
    } else {
      $("combo-makeup-name").textContent = boca.nome;
      $("combo-makeup-detail").textContent = itemDetailLines(boca).join(" • ");
      $("combo-splash-name").textContent = splash.nome;
      $("combo-splash-detail").textContent = itemDetailLines(splash).join(" • ");
      $("combo-message").textContent = pickRandom(MENSAGENS);
      $("combo-result").hidden = false;
    }
  }, SPIN_DURATION);
}

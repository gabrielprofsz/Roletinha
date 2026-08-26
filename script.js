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
const SPIN_DURATION = 4500; // 4.5s — todas as roletas giram por mais tempo agora

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
    pool = pool.concat(itensDaRoleta(catKey));
  });
  return poolForMood(pool);
}

function renderComboWheels() {
  const wrap = $("combo-wheels");
  wrap.innerHTML = "";
  COMBO_CATEGORIAS.forEach((combo) => {
    const iconKey = combo.roletas[0];
    const meta = CATEGORIAS_ROLETA[iconKey];
    const el = document.createElement("div");
    el.className = "wheel-wrap wheel-wrap--combo";
    el.id = `combo-wrap-${combo.key}`;
    el.innerHTML = `
      <span class="pointer pointer--mini" aria-hidden="true"></span>
      <div class="wheel wheel--mini" id="combo-wheel-${combo.key}">
        <div class="wheel-hub wheel-hub--mini">
          <img src="assets/icons/${iconKey}.png" alt="" onerror="this.style.display='none'">
          <span>${meta.emoji}</span>
        </div>
      </div>
      <p class="wheel-caption">${combo.label}</p>
    `;
    wrap.appendChild(el);
  });
}

function openCombo() {
  $("combo-mood-pill").textContent = moodLabel(state.mood);
  renderComboWheels();

  COMBO_CATEGORIAS.forEach((combo) => {
    const pool = comboPoolFor(combo);
    const wheelEl = $(`combo-wheel-${combo.key}`);
    wheelEl.style.background = buildWheelGradient(pool, combo.roletas[0]);
    wheelEl.style.transform = "rotate(0deg)";
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

  playSafe(audioSpin);
  sorteios.forEach(({ combo, pool, index }) => {
    spinWheelEl($(`combo-wheel-${combo.key}`), pool, index, SPIN_DURATION, combo.roletas[0]);
  });

  setTimeout(() => {
    stopSafe(audioSpin);
    $("combo-spin-again-btn").hidden = false;

    if (eggTurn) {
      playSafe(audioEgg);
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

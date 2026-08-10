/* =========================================================
   ROLETINHA — protótipo (Etapa 1)
   Dados de exemplo abaixo — na Etapa 2 isso vira cadastro
   editável com armazenamento persistente (localStorage).
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

// ---------- itens de exemplo ----------
// "cor" define a fatia da roleta. tags de clima: "date"/"trabalho"/"casa" — sem tags combina com qualquer clima
const MAQUIAGENS = [
  { id: "m1", nome: "Blush Ruby Rose", cor: "#E8798A",
    funcao: "blush cremoso, dá um efeito corado natural nas maçãs do rosto.",
    combina: "combina com roupas em tons neutros e claros.",
    climas: [] },
  { id: "m2", nome: "Batom Vermelho Clássico", cor: "#B5192A",
    funcao: "batom matte de longa duração, cor vermelho intenso.",
    combina: "combina com looks pretos ou monocromáticos — perfeito pra um date.",
    climas: ["date"] },
  { id: "m3", nome: "Base Leve Natural", cor: "#D9B291",
    funcao: "base de cobertura leve, acabamento natural pro dia a dia.",
    combina: "combina com qualquer produção, ideal pra rotina no trabalho.",
    climas: ["trabalho", "casa"] },
  { id: "m4", nome: "Paleta de Sombras Terrosas", cor: "#9C6B3E",
    funcao: "tons terrosos versáteis, do esfumado suave ao mais marcado.",
    combina: "combina com roupas em tons quentes e jeans.",
    climas: [] },
  { id: "m5", nome: "Gloss Rosé", cor: "#E8B4C8",
    funcao: "gloss translúcido com leve brilho e toque hidratante.",
    combina: "combina com um visual mais leve, de fim de tarde em casa.",
    climas: ["casa"] },
];

const SPLASHES = [
  { id: "s1", nome: "Body Splash Flor de Cerejeira", cor: "#F4C6D8",
    funcao: "fragrância floral e delicada, fixação leve.",
    combina: "combina com dias tranquilos e roupas claras.",
    climas: ["casa"] },
  { id: "s2", nome: "Body Splash Âmbar Noturno", cor: "#B87A4A",
    funcao: "fragrância amadeirada e envolvente, mais marcante.",
    combina: "combina com um date à noite.",
    climas: ["date"] },
  { id: "s3", nome: "Body Splash Cítrico Fresh", cor: "#F2D06B",
    funcao: "fragrância cítrica leve, energizante pra começar o dia.",
    combina: "combina com a rotina de trabalho.",
    climas: ["trabalho"] },
  { id: "s4", nome: "Body Splash Baunilha Doce", cor: "#E9CBA0",
    funcao: "fragrância adocicada e aconchegante.",
    combina: "combina com qualquer ocasião — um clássico coringa.",
    climas: [] },
];

// ---------- estado ----------
const state = {
  mood: "aleatorio",
  spinCount: 0, // contador global de giros nesta sessão (easter egg a cada 7)
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

// ---------- navegação ----------
document.querySelectorAll("[data-open]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tipo = btn.dataset.open;
    if (tipo === "combo") {
      openCombo();
    } else {
      openRoulette(tipo);
    }
  });
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

function buildWheelGradient(pool) {
  const n = pool.length;
  const slice = 360 / n;
  let stops = [];
  pool.forEach((item, i) => {
    const start = (slice * i).toFixed(2);
    const end = (slice * (i + 1)).toFixed(2);
    stops.push(`${item.cor} ${start}deg ${end}deg`);
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function spinWheelEl(wheelEl, pool, selectedIndex, durationMs) {
  const n = pool.length;
  const slice = 360 / n;
  // ângulo pra o ponteiro (fixo no topo) cair no meio da fatia sorteada
  const landingAngle = 360 - (selectedIndex * slice + slice / 2);
  const extraSpins = 360 * (5 + Math.floor(Math.random() * 2)); // 5-6 voltas completas
  const finalAngle = extraSpins + landingAngle;

  wheelEl.style.background = buildWheelGradient(pool);
  wheelEl.style.transition = "none";
  wheelEl.style.transform = "rotate(0deg)";
  // força reflow pra garantir que o reset acima seja aplicado antes de animar
  void wheelEl.offsetWidth;

  requestAnimationFrame(() => {
    wheelEl.style.transition = `transform ${durationMs}ms cubic-bezier(.12,.67,.1,1)`;
    wheelEl.style.transform = `rotate(${finalAngle}deg)`;
  });
}

// ---------- roleta simples (maquiagem / splash) ----------
let currentList = [];
let currentKind = "maquiagem";
const SPIN_DURATION = 3400;

function openRoulette(tipo) {
  currentKind = tipo;
  currentList = tipo === "maquiagem" ? MAQUIAGENS : SPLASHES;

  $("roulette-title").textContent = tipo === "maquiagem" ? "maquiagem" : "body splash";
  $("roulette-mood-pill").textContent = moodLabel(state.mood);
  $("wheel-hub-icon").textContent = tipo === "maquiagem" ? "💄" : "🌸";

  const pool = poolForMood(currentList);
  $("wheel").style.background = buildWheelGradient(pool);
  $("wheel").style.transform = "rotate(0deg)";

  $("result").hidden = true;
  $("egg").hidden = true;
  $("wheel-wrap").hidden = false;
  $("spin-btn").hidden = false;
  $("spin-btn").disabled = false;
  $("spin-again-btn").hidden = true;

  showScreen("screen-roulette");
}

$("spin-btn").addEventListener("click", () => spinRoulette());
$("spin-again-btn").addEventListener("click", () => spinRoulette());

function spinRoulette() {
  $("result").hidden = true;
  $("egg").hidden = true;
  $("wheel-wrap").hidden = false;
  $("spin-btn").hidden = true;
  $("spin-again-btn").hidden = true;

  const pool = poolForMood(currentList);
  const selectedIndex = Math.floor(Math.random() * pool.length);
  const sorteado = pool[selectedIndex];
  const eggTurn = isEasterEggTurn();

  playSafe(audioSpin);
  spinWheelEl($("wheel"), pool, selectedIndex, SPIN_DURATION);

  setTimeout(() => {
    stopSafe(audioSpin);
    $("spin-again-btn").hidden = false;

    if (eggTurn) {
      playSafe(audioEgg);
      $("egg-text").textContent = pickRandom(EASTER_EGGS);
      $("egg").hidden = false;
    } else {
      $("result-kicker").textContent =
        currentKind === "maquiagem" ? "hoje você vai usar" : "seu body splash de hoje";
      $("result-name").textContent = sorteado.nome;
      $("detail-funcao").textContent = sorteado.funcao;
      $("detail-combina").textContent = sorteado.combina;
      $("result-message").textContent = pickRandom(MENSAGENS);
      $("result").hidden = false;
    }
  }, SPIN_DURATION);
}

// ---------- combo do dia ----------
function openCombo() {
  $("combo-mood-pill").textContent = moodLabel(state.mood);

  const poolM = poolForMood(MAQUIAGENS);
  const poolS = poolForMood(SPLASHES);
  $("combo-wheel-1").style.background = buildWheelGradient(poolM);
  $("combo-wheel-1").style.transform = "rotate(0deg)";
  $("combo-wheel-2").style.background = buildWheelGradient(poolS);
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

  const poolM = poolForMood(MAQUIAGENS);
  const poolS = poolForMood(SPLASHES);
  const indexM = Math.floor(Math.random() * poolM.length);
  const indexS = Math.floor(Math.random() * poolS.length);
  const maquiagem = poolM[indexM];
  const splash = poolS[indexS];
  const eggTurn = isEasterEggTurn();

  playSafe(audioSpin);
  spinWheelEl($("combo-wheel-1"), poolM, indexM, SPIN_DURATION);
  spinWheelEl($("combo-wheel-2"), poolS, indexS, SPIN_DURATION);

  setTimeout(() => {
    stopSafe(audioSpin);
    $("combo-spin-again-btn").hidden = false;

    if (eggTurn) {
      playSafe(audioEgg);
      $("combo-egg-text").textContent = pickRandom(EASTER_EGGS);
      $("combo-egg").hidden = false;
    } else {
      $("combo-makeup-name").textContent = maquiagem.nome;
      $("combo-makeup-detail").textContent = maquiagem.funcao;
      $("combo-splash-name").textContent = splash.nome;
      $("combo-splash-detail").textContent = splash.funcao;
      $("combo-message").textContent = pickRandom(MENSAGENS);
      $("combo-result").hidden = false;
    }
  }, SPIN_DURATION);
}

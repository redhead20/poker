// ---------- Utilities ----------
const SUITS = [
  { s: "♠", color: "black" },
  { s: "♥", color: "red" },
  { s: "♦", color: "red" },
  { s: "♣", color: "black" }
];

// IMPORTANT: Ten uses "10" (not "T")
const RANKS = [
  { r: "2", v: 2 }, { r: "3", v: 3 }, { r: "4", v: 4 }, { r: "5", v: 5 },
  { r: "6", v: 6 }, { r: "7", v: 7 }, { r: "8", v: 8 }, { r: "9", v: 9 },
  { r: "10", v: 10 }, { r: "J", v: 11 }, { r: "Q", v: 12 }, { r: "K", v: 13 }, { r: "A", v: 14 }
];

function makeDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank: rank.r, value: rank.v, suit: suit.s, color: suit.color });
    }
  }
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function cardToUI(card) {
  const div = document.createElement("div");
  div.className = `cardUI ${card.color === "red" ? "red" : ""}`;
  div.innerHTML = `
    <div class="small">${card.rank}${card.suit}</div>
    <div class="suit">${card.suit}</div>
  `;
  return div;
}

function byValueDesc(a, b) { return b - a; }

function valueToRank(v) {
  const map = {14:"A",13:"K",12:"Q",11:"J",10:"10",9:"9",8:"8",7:"7",6:"6",5:"5",4:"4",3:"3",2:"2"};
  return map[v] || String(v);
}

// Parse examples like "As", "10d", "7h", "9c"
// ALSO accepts old "Ts" just in case (treated as 10)
function parseCard(code) {
  const txt = code.trim();
  const suitChar = txt.slice(-1).toLowerCase();
  const rankPart = txt.slice(0, -1).toUpperCase(); // "A" or "10" or "T"

  const suitMap = { s:"♠", h:"♥", d:"♦", c:"♣" };
  const rankMap = { A:14, K:13, Q:12, J:11, "10":10, T:10, "9":9, "8":8, "7":7, "6":6, "5":5, "4":4, "3":3, "2":2 };

  const suitSym = suitMap[suitChar];
  const value = rankMap[rankPart];
  const displayRank = (rankPart === "T") ? "10" : rankPart;

  const color = (suitSym === "♥" || suitSym === "♦") ? "red" : "black";
  return { rank: displayRank, value, suit: suitSym, color };
}

// ---------- Tabs ----------
const tabs = document.querySelectorAll(".tab");
const views = document.querySelectorAll(".view");

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    btn.classList.add("active");

    const id = btn.dataset.view;
    views.forEach(v => v.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  });
});

// ---------- Learn panel ----------
const learnPanel = document.getElementById("learnPanel");
const tsteps = document.querySelectorAll(".tstep");

const learnText = {
  preflop: `Everyone gets <strong>2 private cards</strong>. Small blind + big blind are posted. Action starts left of the big blind.`,
  flop: `Dealer reveals <strong>3 community cards</strong>. Another betting round. You now have 5 cards to work with (2+3).`,
  turn: `Dealer reveals the <strong>4th community card</strong>. Betting again. Draws get clearer.`,
  river: `Dealer reveals the <strong>5th community card</strong>. Final betting round.`,
  showdown: `If more than one player remains, players reveal hands. Best <strong>5-card</strong> hand wins.`
};

function setLearnStep(step) {
  tsteps.forEach(b => b.classList.remove("active"));
  document.querySelector(`.tstep[data-step="${step}"]`).classList.add("active");
  learnPanel.innerHTML = learnText[step];
}
setLearnStep("preflop");
tsteps.forEach(b => b.addEventListener("click", () => setLearnStep(b.dataset.step)));

// ---------- Practice ----------
const holeEl = document.getElementById("hole");
const boardEl = document.getElementById("board");

const btnNew = document.getElementById("newHand");
const btnFlop = document.getElementById("dealFlop");
const btnTurn = document.getElementById("dealTurn");
const btnRiver = document.getElementById("dealRiver");
const btnReset = document.getElementById("reset");

const bestHandEl = document.getElementById("bestHand");
const strengthEl = document.getElementById("strength");
const outsEl = document.getElementById("outs");

let deck = [];
let hole = [];
let board = [];

function renderPractice() {
  holeEl.innerHTML = "";
  boardEl.innerHTML = "";
  hole.forEach(c => holeEl.appendChild(cardToUI(c)));
  board.forEach(c => boardEl.appendChild(cardToUI(c)));

  if (hole.length === 2) {
    if (board.length < 3) {
      bestHandEl.textContent = "—";
      strengthEl.textContent = "Deal the flop to evaluate";
      outsEl.textContent = "—";
    } else {
      const all = [...hole, ...board];
      const evalResult = evaluateBestHand(all);
      bestHandEl.textContent = evalResult.name;
      strengthEl.textContent = evalResult.detail;

      const outs = estimateOuts(all);
      outsEl.textContent = outs === null ? "—" : `${outs} outs (approx)`;
    }
  }
}

function resetState() {
  deck = shuffle(makeDeck());
  hole = [];
  board = [];

  btnFlop.disabled = true;
  btnTurn.disabled = true;
  btnRiver.disabled = true;

  bestHandEl.textContent = "—";
  strengthEl.textContent = "—";
  outsEl.textContent = "—";
  renderPractice();
}

btnReset.addEventListener("click", resetState);

btnNew.addEventListener("click", () => {
  resetState();
  hole = [deck.pop(), deck.pop()];
  btnFlop.disabled = false;
  renderPractice();
});

btnFlop.addEventListener("click", () => {
  if (board.length === 0) {
    board.push(deck.pop(), deck.pop(), deck.pop());
    btnFlop.disabled = true;
    btnTurn.disabled = false;
    renderPractice();
  }
});

btnTurn.addEventListener("click", () => {
  if (board.length === 3) {
    board.push(deck.pop());
    btnTurn.disabled = true;
    btnRiver.disabled = false;
    renderPractice();
  }
});

btnRiver.addEventListener("click", () => {
  if (board.length === 4) {
    board.push(deck.pop());
    btnRiver.disabled = true;
    renderPractice();
  }
});

resetState();

// ---------- Hand Evaluation ----------
function countBy(arr, keyFn) {
  const m = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

function getSortedValues(cards) {
  return cards.map(c => c.value).sort(byValueDesc);
}

function isStraight(values) {
  const uniq = [...new Set(values)].sort((a, b) => b - a);

  // Wheel A-2-3-4-5
  const wheel = [14, 5, 4, 3, 2];
  const hasWheel = wheel.every(v => uniq.includes(v));
  if (hasWheel) return { ok: true, high: 5 };

  for (let i = 0; i <= uniq.length - 5; i++) {
    const run = uniq.slice(i, i + 5);
    const high = run[0];
    let ok = true;
    for (let j = 1; j < run.length; j++) {
      if (run[j] !== high - j) { ok = false; break; }
    }
    if (ok) return { ok: true, high };
  }
  return { ok: false, high: null };
}

function evaluateBestHand(cards) {
  const bySuit = new Map();
  for (const c of cards) {
    if (!bySuit.has(c.suit)) bySuit.set(c.suit, []);
    bySuit.get(c.suit).push(c);
  }

  const values = getSortedValues(cards);
  const counts = countBy(cards, c => c.value);

  const groups = [...counts.entries()]
    .map(([v, n]) => ({ v: Number(v), n }))
    .sort((a, b) => (b.n - a.n) || (b.v - a.v));

  const flushEntry = [...bySuit.entries()].find(([, arr]) => arr.length >= 5);
  const flushCards = flushEntry ? flushEntry[1].slice().sort((a, b) => b.value - a.value) : null;

  // Straight flush (or Royal Flush)
  if (flushCards) {
    const sf = isStraight(flushCards.map(c => c.value));
    if (sf.ok) {
      if (sf.high === 14) {
        return { rank: 10, name: "Royal Flush", detail: "10-J-Q-K-A, same suit" };
      }
      return { rank: 9, name: "Straight Flush", detail: sf.high === 5 ? "Wheel straight flush" : `Straight flush to ${valueToRank(sf.high)}` };
    }
  }

  // Quads
  if (groups[0]?.n === 4) {
    return { rank: 8, name: "Four of a Kind", detail: `Four ${valueToRank(groups[0].v)}s` };
  }

  // Full house
  if (groups[0]?.n === 3 && groups[1]?.n >= 2) {
    return { rank: 7, name: "Full House", detail: `${valueToRank(groups[0].v)}s full of ${valueToRank(groups[1].v)}s` };
  }

  // Flush
  if (flushCards) {
    return { rank: 6, name: "Flush", detail: `Flush (high ${valueToRank(flushCards[0].value)})` };
  }

  // Straight
  const st = isStraight(values);
  if (st.ok) {
    return { rank: 5, name: "Straight", detail: st.high === 5 ? "Wheel straight" : `Straight to ${valueToRank(st.high)}` };
  }

  // Trips
  if (groups[0]?.n === 3) {
    return { rank: 4, name: "Three of a Kind", detail: `Three ${valueToRank(groups[0].v)}s` };
  }

  // Two pair
  if (groups[0]?.n === 2 && groups[1]?.n === 2) {
    const hi = Math.max(groups[0].v, groups[1].v);
    const lo = Math.min(groups[0].v, groups[1].v);
    return { rank: 3, name: "Two Pair", detail: `${valueToRank(hi)}s and ${valueToRank(lo)}s` };
  }

  // Pair
  if (groups[0]?.n === 2) {
    return { rank: 2, name: "One Pair", detail: `Pair of ${valueToRank(groups[0].v)}s` };
  }

  return { rank: 1, name: "High Card", detail: `High card ${valueToRank(values[0])}` };
}

// ---------- Outs (simple estimate) ----------
function estimateOuts(cards) {
  if (cards.length >= 7) return null;

  const suitCounts = countBy(cards, c => c.suit);
  let maxSuit = 0;
  for (const n of suitCounts.values()) maxSuit = Math.max(maxSuit, n);
  if (maxSuit === 4) return 9;

  const uniq = [...new Set(cards.map(c => c.value))].sort((a, b) => a - b);
  const uniq2 = uniq.includes(14) ? [1, ...uniq] : [...uniq];

  let best = null;
  for (let start = 1; start <= 10; start++) {
    const run = [start, start+1, start+2, start+3, start+4];
    const have = run.filter(v => uniq2.includes(v)).length;
    if (have === 4) {
      const missing = run.filter(v => !uniq2.includes(v))[0];
      const isOpen = (missing === run[0] || missing === run[4]);
      const outs = isOpen ? 8 : 4;
      if (!best || outs > best) best = outs;
    }
  }
  return best;
}

// ---------- Hand Rankings ----------
document.addEventListener("DOMContentLoaded", () => {
  const rankListEl = document.getElementById("rankList");
  const exHoleEl = document.getElementById("exHole");
  const exBoardEl = document.getElementById("exBoard");
  const exNameEl = document.getElementById("exName");

  const RANKING_EXAMPLES = [
    {
      name: "Royal Flush",
      desc: "10-J-Q-K-A, same suit. Best possible hand.",
      hole: ["As","Ks"],
      board: ["Qs","Js","10s","2d","9c"]
    },
    {
      name: "Straight Flush",
      desc: "Five in a row, same suit (not royal).",
      hole: ["9h","8h"],
      board: ["7h","6h","5h","Qd","2c"]
    },
    { name: "Four of a Kind", desc: "Four cards of the same rank.", hole: ["Ah","Ac"], board: ["Ad","As","7c","2s","9d"] },
    { name: "Full House", desc: "Three of a kind + a pair.", hole: ["Kh","Kd"], board: ["Kc","7s","7d","2c","9h"] },
    { name: "Flush", desc: "Five cards same suit (not in order).", hole: ["Ah","2h"], board: ["Kh","9h","6h","Qs","3d"] },
    { name: "Straight", desc: "Five in a row (mixed suits).", hole: ["9s","8d"], board: ["7c","6h","5s","Qd","2c"] },
    { name: "Three of a Kind", desc: "Three cards of the same rank.", hole: ["Jc","Jh"], board: ["Jd","7s","2c","9h","Qd"] },
    { name: "Two Pair", desc: "Two different pairs.", hole: ["Ah","Ad"], board: ["Ks","Kd","7c","2s","9d"] },
    { name: "One Pair", desc: "One pair + three kickers.", hole: ["Qh","Qs"], board: ["7d","2c","9h","Kd","3s"] },
    { name: "High Card", desc: "No made hand — highest card plays.", hole: ["As","9d"], board: ["Kd","7c","4h","2s","8c"] }
  ];

  function loadExample(i) {
    const ex = RANKING_EXAMPLES[i];

    document.querySelectorAll(".rank-item").forEach(x => x.classList.remove("active"));
    document.querySelector(`.rank-item[data-i="${i}"]`)?.classList.add("active");

    const holeCards = ex.hole.map(parseCard);
    const boardCards = ex.board.map(parseCard);

    exHoleEl.innerHTML = "";
    exBoardEl.innerHTML = "";
    holeCards.forEach(c => exHoleEl.appendChild(cardToUI(c)));
    boardCards.forEach(c => exBoardEl.appendChild(cardToUI(c)));

    const evalResult = evaluateBestHand([...holeCards, ...boardCards]);
    exNameEl.textContent = `${evalResult.name} — ${evalResult.detail}`;
  }

  function buildRankingList() {
    rankListEl.innerHTML = "";
    RANKING_EXAMPLES.forEach((r, i) => {
      const div = document.createElement("div");
      div.className = "rank-item";
      div.dataset.i = String(i);
      div.innerHTML = `
        <div class="rank-name">${i + 1}. ${r.name}</div>
        <div class="rank-desc">${r.desc}</div>
      `;
      div.addEventListener("click", () => loadExample(i));
      rankListEl.appendChild(div);
    });
  }

  buildRankingList();
  loadExample(0);
});
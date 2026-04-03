
const SUITS = [
  { s: "♠", color: "black" },
  { s: "♥", color: "red" },
  { s: "♦", color: "red" },
  { s: "♣", color: "black" }
];

const RANKS = [
  { r: "2", v: 2 }, { r: "3", v: 3 }, { r: "4", v: 4 }, { r: "5", v: 5 },
  { r: "6", v: 6 }, { r: "7", v: 7 }, { r: "8", v: 8 }, { r: "9", v: 9 },
  { r: "10", v: 10 }, { r: "J", v: 11 }, { r: "Q", v: 12 },
  { r: "K", v: 13 }, { r: "A", v: 14 }
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

function parseCard(code) {
  const txt = code.trim();
  const suitChar = txt.slice(-1).toLowerCase();
  const rankPart = txt.slice(0, -1).toUpperCase();

  const suitMap = { s: "♠", h: "♥", d: "♦", c: "♣" };
  const rankMap = {
    A: 14, K: 13, Q: 12, J: 11,
    "10": 10, T: 10,
    "9": 9, "8": 8, "7": 7, "6": 6,
    "5": 5, "4": 4, "3": 3, "2": 2
  };

  const suit = suitMap[suitChar];
  const value = rankMap[rankPart];
  const displayRank = rankPart === "T" ? "10" : rankPart;

  const color = (suit === "♥" || suit === "♦") ? "red" : "black";

  return { rank: displayRank, value, suit, color };
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
  const map = { 14: "A", 13: "K", 12: "Q", 11: "J", 10: "10", 9: "9", 8: "8", 7: "7", 6: "6", 5: "5", 4: "4", 3: "3", 2: "2" };
  return map[v];
}

const tabs = document.querySelectorAll(".tab");
const views = document.querySelectorAll(".view");

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    btn.classList.add("active");

    views.forEach(v => v.classList.remove("active"));
    document.getElementById(btn.dataset.view).classList.add("active");
  });
});

const learnPanel = document.getElementById("learnPanel");
const tsteps = document.querySelectorAll(".tstep");

const learnText = {
  preflop: "Everyone gets 2 private cards. Blinds posted.",
  flop: "3 community cards revealed.",
  turn: "4th card revealed.",
  river: "5th card revealed.",
  showdown: "Best 5-card hand wins."
};

function setLearnStep(step) {
  tsteps.forEach(b => b.classList.remove("active"));
  document.querySelector(`.tstep[data-step="${step}"]`).classList.add("active");
  learnPanel.innerHTML = learnText[step];
}

setLearnStep("preflop");
tsteps.forEach(b => b.addEventListener("click", () => setLearnStep(b.dataset.step)));

const holeEl = document.getElementById("hole");
const boardEl = document.getElementById("board");

const btnNew = document.getElementById("newHand");
const btnFlop = document.getElementById("dealFlop");
const btnTurn = document.getElementById("dealTurn");
const btnRiver = document.getElementById("dealRiver");
const btnReset = document.getElementById("reset");

const bestHandEl = document.getElementById("bestHand");
const strengthEl = document.getElementById("strength");

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
      strengthEl.textContent = "Deal the flop";
    } else {
      const result = evaluateBestHand([...hole, ...board]);
      bestHandEl.textContent = result.name;
      strengthEl.textContent = result.detail;
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
  board.push(deck.pop(), deck.pop(), deck.pop());
  btnFlop.disabled = true;
  btnTurn.disabled = false;
  renderPractice();
});

btnTurn.addEventListener("click", () => {
  board.push(deck.pop());
  btnTurn.disabled = true;
  btnRiver.disabled = false;
  renderPractice();
});

btnRiver.addEventListener("click", () => {
  board.push(deck.pop());
  btnRiver.disabled = true;
  renderPractice();
});

resetState();

function evaluateBestHand(cards) {
  const values = cards.map(c => c.value).sort((a, b) => b - a);

  
  const counts = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);

  const groups = Object.entries(counts)
    .map(([v, n]) => ({ v: Number(v), n }))
    .sort((a, b) => b.n - a.n || b.v - a.v);

  const suitCounts = {};
  cards.forEach(c => {
    suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  });

  const flushSuit = Object.keys(suitCounts).find(s => suitCounts[s] >= 5);
  const flushCards = flushSuit
    ? cards.filter(c => c.suit === flushSuit).map(c => c.value).sort((a, b) => b - a)
    : null;

  function isStraight(vals) {
    const uniq = [...new Set(vals)].sort((a, b) => b - a);

    if ([14, 5, 4, 3, 2].every(v => uniq.includes(v))) return 5;

    for (let i = 0; i <= uniq.length - 5; i++) {
      let ok = true;
      for (let j = 1; j < 5; j++) {
        if (uniq[i + j] !== uniq[i] - j) ok = false;
      }
      if (ok) return uniq[i];
    }
    return null;
  }

  const straightHigh = isStraight(values);

  if (flushCards) {
    const sfHigh = isStraight(flushCards);
    if (sfHigh) {
      if (sfHigh === 14) {
        return { name: "Royal Flush", detail: "10-J-Q-K-A same suit" };
      }
      return { name: "Straight Flush", detail: `to ${valueToRank(sfHigh)}` };
    }
  }

  if (groups[0]?.n === 4) {
    return { name: "Four of a Kind", detail: `${valueToRank(groups[0].v)}s` };
  }

  if (groups[0]?.n === 3 && groups[1]?.n >= 2) {
    return {
      name: "Full House",
      detail: `${valueToRank(groups[0].v)}s full of ${valueToRank(groups[1].v)}s`
    };
  }

  if (flushCards) {
    return { name: "Flush", detail: `high ${valueToRank(flushCards[0])}` };
  }

  if (straightHigh) {
    return { name: "Straight", detail: `to ${valueToRank(straightHigh)}` };
  }

  if (groups[0]?.n === 3) {
    return { name: "Three of a Kind", detail: `${valueToRank(groups[0].v)}s` };
  }


  if (groups[0]?.n === 2 && groups[1]?.n === 2) {
    return {
      name: "Two Pair",
      detail: `${valueToRank(groups[0].v)} & ${valueToRank(groups[1].v)}`
    };
  }


  if (groups[0]?.n === 2) {
    return { name: "One Pair", detail: `${valueToRank(groups[0].v)}s` };
  }


  return { name: "High Card", detail: valueToRank(values[0]) };
}

document.addEventListener("DOMContentLoaded", () => {
  const rankList = document.getElementById("rankList");
  const exHole = document.getElementById("exHole");
  const exBoard = document.getElementById("exBoard");
  const exName = document.getElementById("exName");

  const examples = [
    {
      name: "Royal Flush",
      hole: ["As", "Ks"],
      board: ["Qs", "Js", "10s", "2d", "9c"]
    },
    {
      name: "Straight Flush",
      hole: ["9h", "8h"],
      board: ["7h", "6h", "5h", "Qd", "2c"]
    },
    {
      name: "Four of a Kind",
      hole: ["Ah", "Ac"],
      board: ["Ad", "As", "7c", "2s", "9d"]
    },
    {
      name: "Full House",
      hole: ["Kh", "Kd"],
      board: ["Kc", "7s", "7d", "2c", "9h"]
    },
    {
      name: "Flush",
      hole: ["Ah", "2h"],
      board: ["Kh", "9h", "6h", "Qs", "3d"]
    },
    {
      name: "Straight",
      hole: ["9s", "8d"],
      board: ["7c", "6h", "5s", "Qd", "2c"]
    },
    {
      name: "Three of a Kind",
      hole: ["Jc", "Jh"],
      board: ["Jd", "7s", "2c", "9h", "Qd"]
    },
    {
      name: "Two Pair",
      hole: ["Ah", "Ad"],
      board: ["Ks", "Kd", "7c", "2s", "9d"]
    },
    {
      name: "One Pair",
      hole: ["Qh", "Qs"],
      board: ["7d", "2c", "9h", "Kd", "3s"]
    },
    {
      name: "High Card",
      hole: ["As", "9d"],
      board: ["Kd", "7c", "4h", "2s", "8c"]
    }
  ];

  function loadExample(i) {
    const ex = examples[i];
    exHole.innerHTML = "";
    exBoard.innerHTML = "";

    ex.hole.map(parseCard).forEach(c => exHole.appendChild(cardToUI(c)));
    ex.board.map(parseCard).forEach(c => exBoard.appendChild(cardToUI(c)));

    exName.textContent = ex.name;
  }

  examples.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "rank-item";
    div.textContent = r.name;
    div.onclick = () => loadExample(i);
    rankList.appendChild(div);
  });

  loadExample(0);
});

const posInfo = document.getElementById("posInfo");
const posDescriptions = {
  utg: "First to act",
  mp: "Middle position",
  co: "Cutoff",
  btn: "Dealer (best position)",
  sb: "Small blind",
  bb: "Big blind"
};

document.querySelectorAll(".pos-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    posInfo.textContent = posDescriptions[btn.dataset.pos];
  });
});

document.getElementById("homeButton").addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelector('[data-view="learn"]').classList.add("active");

  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("learn").classList.add("active");
});
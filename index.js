const PLAYABLE_MASK = [
  "0000000000000000000000000000",
  "0000000000000000000000000000",
  "0000000000000000000000000000",
  "0000000000000001110000000000",
  "0000000000000111111100000000",
  "0000000000011111111100000000",
  "1110000011111111111110000000",
  "1111100111111111111110000000",
  "1111111111111111111110000000",
  "1111111111111111111110000000",
  "1111111111111111111111000000",
  "1111111111111110111111000000",
  "1111111111111100111111000000",
  "1111111111111101111111111000",
  "1111111111110001111111111111",
  "1111111111100000111111111111",
  "1111111111000000111111111111",
  "1111111110000000111111111111",
  "1111111100000000111111111111",
  "1111111000000000111111111111",
  "1111110000000000111111111111",
  "1111100000000000011111111111"
];

const ROWS = PLAYABLE_MASK.length;
const COLS = PLAYABLE_MASK[0].length;
const MINE_RATIO = 0.15;

const boardElement = document.getElementById("board");
const mineCounterElement = document.getElementById("mine-counter");
const statusElement = document.getElementById("status-text");
const statusNoteElement = document.getElementById("status-note");
const resetButton = document.getElementById("reset-button");
const videoModal = document.getElementById("video-modal");
const videoModalTitle = document.getElementById("video-modal-title");
const videoFrame = document.getElementById("video-frame");
const videoModalClose = document.getElementById("video-modal-close");

const FLAG_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="10.5" y="2" width="2" height="14" fill="#000000" />
    <polygon points="12.5,2 4,6.6 12.5,10.8" fill="#d3161d" stroke="#7b0000" stroke-width="0.6" />
    <rect x="8" y="16" width="7" height="2" fill="#000000" />
    <rect x="5" y="18" width="13" height="2.8" fill="#d8d8d8" />
    <rect x="4" y="20.3" width="15" height="1.7" fill="#6c6c6c" />
  </svg>
`;

const MINE_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <line x1="12" y1="1.8" x2="12" y2="22.2" stroke="#000000" stroke-width="1.4" />
    <line x1="1.8" y1="12" x2="22.2" y2="12" stroke="#000000" stroke-width="1.4" />
    <line x1="4.1" y1="4.1" x2="19.9" y2="19.9" stroke="#000000" stroke-width="1.4" />
    <line x1="19.9" y1="4.1" x2="4.1" y2="19.9" stroke="#000000" stroke-width="1.4" />
    <circle cx="12" cy="12" r="5.1" fill="#000000" />
    <circle cx="10.2" cy="9.8" r="1.7" fill="#ffffff" />
  </svg>
`;

const FACE_ICONS = {
  idle: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="#ffd34d" stroke="#000000" stroke-width="1.2" />
      <circle cx="8.2" cy="9.2" r="1.15" fill="#000000" />
      <circle cx="15.8" cy="9.2" r="1.15" fill="#000000" />
      <path d="M7.2 14.2c1.4 2 8.2 2 9.6 0" fill="none" stroke="#000000" stroke-width="1.3" stroke-linecap="round" />
    </svg>
  `,
  surprised: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="#ffd34d" stroke="#000000" stroke-width="1.2" />
      <circle cx="8.2" cy="9.2" r="1.15" fill="#000000" />
      <circle cx="15.8" cy="9.2" r="1.15" fill="#000000" />
      <circle cx="12" cy="15.1" r="2" fill="#000000" />
    </svg>
  `,
  won: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="#ffd34d" stroke="#000000" stroke-width="1.2" />
      <path d="M6.9 9.2l2 1.3 1.1-2.2" fill="none" stroke="#000000" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M14 9.2l2 1.3 1.1-2.2" fill="none" stroke="#000000" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M7.2 14c1.4 2.4 8.2 2.4 9.6 0" fill="none" stroke="#000000" stroke-width="1.3" stroke-linecap="round" />
    </svg>
  `,
  lost: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="#ffd34d" stroke="#000000" stroke-width="1.2" />
      <path d="M6.9 7.9l2.6 2.6M9.5 7.9l-2.6 2.6" stroke="#000000" stroke-width="1.2" stroke-linecap="round" />
      <path d="M14.5 7.9l2.6 2.6M17.1 7.9l-2.6 2.6" stroke="#000000" stroke-width="1.2" stroke-linecap="round" />
      <path d="M7.6 16.5c1.3-1.9 7.5-1.9 8.8 0" fill="none" stroke="#000000" stroke-width="1.3" stroke-linecap="round" />
    </svg>
  `
};

const TITLE_ROTATIONS = [
  "Trump | We're Going To Win So Much",
  "Trump | You May Even Get Tired Of Winning",
  "Trump | We Keep Winning",
  "Trump | Another Click Another Win",
  "Trump | Still Winning In Hormuz"
];

const cells = [];
const neighbors = [];
const playableIndices = [];

let mineCount = 0;
let flaggedCount = 0;
let safeCellsRemaining = 0;
let minesSeeded = false;
let gameState = "ready";
let faceState = "idle";
let titleIndex = 0;

function setBrowserTitle(index) {
  document.title = TITLE_ROTATIONS[index];
}

function advanceBrowserTitle() {
  titleIndex = (titleIndex + 1) % TITLE_ROTATIONS.length;
  setBrowserTitle(titleIndex);
}

function buildBoard() {
  boardElement.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  boardElement.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const index = row * COLS + col;
      const playable = PLAYABLE_MASK[row][col] === "1";
      const button = document.createElement("button");

      button.type = "button";
      button.className = `cell ${playable ? "playable" : "blocked"}`;
      button.dataset.index = String(index);

      if (!playable) {
        button.tabIndex = -1;
        button.setAttribute("aria-hidden", "true");
      }

      boardElement.append(button);
      cells.push({
        row,
        col,
        playable,
        mine: false,
        flagged: false,
        revealed: false,
        exploded: false,
        adjacent: 0,
        element: button
      });

      if (playable) {
        playableIndices.push(index);
      }
    }
  }

  for (let index = 0; index < cells.length; index += 1) {
    const cell = cells[index];
    const adjacentIndices = [];

    if (cell.playable) {
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
          if (rowOffset === 0 && colOffset === 0) {
            continue;
          }

          const neighborRow = cell.row + rowOffset;
          const neighborCol = cell.col + colOffset;

          if (
            neighborRow < 0 ||
            neighborRow >= ROWS ||
            neighborCol < 0 ||
            neighborCol >= COLS
          ) {
            continue;
          }

          const neighborIndex = neighborRow * COLS + neighborCol;

          if (cells[neighborIndex].playable) {
            adjacentIndices.push(neighborIndex);
          }
        }
      }
    }

    neighbors[index] = adjacentIndices;
  }

  mineCount = Math.max(40, Math.round(playableIndices.length * MINE_RATIO));
}

function shuffle(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
}

function formatCounter(value) {
  const clamped = Math.max(-99, Math.min(999, value));

  if (clamped < 0) {
    return `-${String(Math.abs(clamped)).padStart(2, "0")}`;
  }

  return String(clamped).padStart(3, "0");
}

function setFace(state) {
  faceState = state;
  resetButton.innerHTML = FACE_ICONS[faceState];
}

function updateHud() {
  let statusText = "READY to start winning!";

  if (gameState === "playing") {
    statusText = `${String(safeCellsRemaining).padStart(3, "0")} SAFE`;
  } else if (gameState === "won") {
    statusText = "CLEAR";
  } else if (gameState === "lost") {
    statusText = "BOOM";
  }

  mineCounterElement.textContent = formatCounter(mineCount - flaggedCount);
  statusElement.textContent = statusText;
}

function resetGame() {
  flaggedCount = 0;
  safeCellsRemaining = playableIndices.length - mineCount;
  minesSeeded = false;
  gameState = "ready";
  touchMode = "dig";
  boardElement.dataset.touchMode = "dig";
  setFace("idle");

  for (const cell of cells) {
    cell.mine = false;
    cell.flagged = false;
    cell.revealed = false;
    cell.exploded = false;
    cell.adjacent = 0;
  }

  render();
}

function seedMines(firstIndex) {
  const protectedIndices = new Set([firstIndex, ...neighbors[firstIndex]]);
  const candidates = playableIndices.filter((index) => !protectedIndices.has(index));

  shuffle(candidates);

  for (let index = 0; index < mineCount; index += 1) {
    cells[candidates[index]].mine = true;
  }

  for (const index of playableIndices) {
    const cell = cells[index];

    if (cell.mine) {
      continue;
    }

    let adjacentMines = 0;

    for (const neighborIndex of neighbors[index]) {
      if (cells[neighborIndex].mine) {
        adjacentMines += 1;
      }
    }

    cell.adjacent = adjacentMines;
  }

  minesSeeded = true;
  gameState = "playing";
}

function revealAllMines() {
  for (const index of playableIndices) {
    const cell = cells[index];

    if (cell.mine) {
      cell.revealed = true;
    }
  }
}

function showVideoModal(title) {
  videoModalTitle.textContent = title;
  videoFrame.src = "https://www.youtube.com/embed/MJMSJM-h6b4?autoplay=1&playsinline=1";
  videoModal.hidden = false;
}

function hideVideoModal() {
  videoModal.hidden = true;
  videoFrame.src = "";
  resetGame();
}

function finishLost() {
  gameState = "lost";
  revealAllMines();
  setFace("lost");
  setTimeout(() => showVideoModal("BOOM"), 200);
}

function finishWon() {
  gameState = "won";
  flaggedCount = mineCount;
  setFace("won");

  for (const index of playableIndices) {
    const cell = cells[index];

    if (cell.mine) {
      cell.flagged = true;
    }
  }

  setTimeout(() => showVideoModal("YOU WIN"), 200);
}

function revealCell(index) {
  const origin = cells[index];

  if (
    gameState === "won" ||
    gameState === "lost" ||
    !origin.playable ||
    origin.flagged ||
    origin.revealed
  ) {
    return;
  }

  if (!minesSeeded) {
    seedMines(index);
  }

  if (origin.mine) {
    origin.exploded = true;
    finishLost();
    render();
    return;
  }

  const stack = [index];

  while (stack.length > 0) {
    const currentIndex = stack.pop();
    const cell = cells[currentIndex];

    if (cell.revealed || cell.flagged || !cell.playable) {
      continue;
    }

    cell.revealed = true;
    safeCellsRemaining -= 1;

    if (cell.adjacent === 0) {
      for (const neighborIndex of neighbors[currentIndex]) {
        const neighbor = cells[neighborIndex];

        if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
          stack.push(neighborIndex);
        }
      }
    }
  }

  if (safeCellsRemaining === 0) {
    finishWon();
  }

  render();
}

function chordCell(index) {
  const cell = cells[index];

  if (
    gameState === "won" ||
    gameState === "lost" ||
    !cell.playable ||
    !cell.revealed ||
    cell.adjacent === 0
  ) {
    return;
  }

  let flagCount = 0;
  for (const neighborIndex of neighbors[index]) {
    if (cells[neighborIndex].flagged) {
      flagCount += 1;
    }
  }

  if (flagCount !== cell.adjacent) {
    return;
  }

  for (const neighborIndex of neighbors[index]) {
    const neighbor = cells[neighborIndex];
    if (!neighbor.revealed && !neighbor.flagged && neighbor.playable) {
      revealCell(neighborIndex);
    }
  }
}

function toggleFlag(index) {
  const cell = cells[index];

  if (
    gameState === "won" ||
    gameState === "lost" ||
    !cell.playable ||
    cell.revealed
  ) {
    return;
  }

  cell.flagged = !cell.flagged;
  flaggedCount += cell.flagged ? 1 : -1;
  render();
}

function renderCell(cell) {
  const button = cell.element;
  button.className = "cell";
  button.replaceChildren();

  if (!cell.playable) {
    button.classList.add("blocked");
    return;
  }

  button.classList.add("playable");

  if (cell.revealed) {
    button.classList.add("revealed");

    if (cell.mine) {
      button.classList.add("mine");

      if (cell.exploded) {
        button.classList.add("exploded");
      }

      button.innerHTML = MINE_ICON;
      return;
    }

    if (cell.adjacent > 0) {
      button.innerHTML = `<span class="digit digit-${cell.adjacent}">${cell.adjacent}</span>`;
    }

    return;
  }

  button.classList.add("hidden");

  if (cell.flagged) {
    button.innerHTML = FLAG_ICON;
  }
}

function render() {
  for (const cell of cells) {
    renderCell(cell);
  }

  updateHud();
}

function handleBoardClick(event) {
  if (longPressFired) {
    longPressFired = false;
    return;
  }

  advanceBrowserTitle();

  const button = event.target.closest(".cell");

  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);

  if (touchMode === "flag") {
    toggleFlag(index);
  } else {
    revealCell(index);
  }
}

function handleBoardContextMenu(event) {
  event.preventDefault();
  advanceBrowserTitle();

  const button = event.target.closest(".cell");

  if (!button) {
    return;
  }

  toggleFlag(Number(button.dataset.index));
}

function handleBoardMouseDown(event) {
  if (event.button !== 0 || (gameState !== "ready" && gameState !== "playing")) {
    return;
  }

  const button = event.target.closest(".cell");

  if (!button) {
    return;
  }

  const cell = cells[Number(button.dataset.index)];

  if (!cell.playable || cell.revealed || cell.flagged) {
    return;
  }

  setFace("surprised");
}

function handleMouseUp() {
  if (gameState === "ready" || gameState === "playing") {
    setFace("idle");
    updateHud();
  }
}

function handleBoardDblClick(event) {
  const button = event.target.closest(".cell");
  if (!button) return;
  chordCell(Number(button.dataset.index));
}

let touchMode = "dig";
let longPressTimer = null;
let longPressFired = false;

function setTouchMode(mode) {
  touchMode = mode;
  boardElement.dataset.touchMode = mode;
  statusNoteElement.textContent = mode === "flag"
    ? "FLAG MODE — tap to flag. Long-press to switch back."
    : "DIG MODE — tap to reveal. Long-press to switch to flag mode.";
  if (navigator.vibrate) navigator.vibrate(50);
}

boardElement.addEventListener("touchstart", (event) => {
  const button = event.target.closest(".cell");
  if (!button) return;

  longPressFired = false;

  longPressTimer = setTimeout(() => {
    longPressFired = true;
    setTouchMode(touchMode === "dig" ? "flag" : "dig");
  }, 500);
}, { passive: true });

boardElement.addEventListener("touchend", () => {
  clearTimeout(longPressTimer);
}, { passive: true });

boardElement.addEventListener("touchmove", () => {
  clearTimeout(longPressTimer);
}, { passive: true });

boardElement.addEventListener("click", handleBoardClick);
boardElement.addEventListener("dblclick", handleBoardDblClick);
boardElement.addEventListener("contextmenu", handleBoardContextMenu);
boardElement.addEventListener("mousedown", handleBoardMouseDown);
document.addEventListener("mouseup", handleMouseUp);
resetButton.addEventListener("click", () => {
  advanceBrowserTitle();
  resetGame();
});
videoModalClose.addEventListener("click", hideVideoModal);

buildBoard();
setBrowserTitle(titleIndex);
resetGame();

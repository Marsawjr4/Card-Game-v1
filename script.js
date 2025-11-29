// File: /mnt/data/script.js
// Minimal inline comments — only to clarify important decisions.

const playArea = document.getElementById('play-area');
const playerHand = document.getElementById('player-hand');
const cpuHand = document.getElementById('cpu-hand');
const newGameBtn = document.getElementById('new-game-btn');
const playerScoreEl = document.getElementById('player-score');
const opponentScoreEl = document.getElementById('opponent-score');
const container = document.getElementById('container');

let playerScore = 0;
let opponentScore = 0;
let isRoundActive = false;

// Create and attach discard UI (shows counts)
let discard = document.getElementById('discard-pile');
if (!discard) {
    discard = document.createElement('div');
    discard.id = 'discard-pile';
    discard.style.marginTop = '8px';
    discard.style.display = 'flex';
    discard.style.gap = '12px';
    discard.innerHTML = `
        <div id="discard-player">Player discard: <span id="discard-player-count">0</span></div>
        <div id="discard-cpu">CPU discard: <span id="discard-cpu-count">0</span></div>
    `;
    container.appendChild(discard);
}
const discardPlayerCountEl = document.getElementById('discard-player-count');
const discardCpuCountEl = document.getElementById('discard-cpu-count');

// Helper: live node list of cards
const allCards = () => document.querySelectorAll('.cards');

// Init on load
window.addEventListener('DOMContentLoaded', () => {
    assignOwners();
    assignValues();
    bindUI();
    renderScores();
    updateDiscardCounts();
});

// Assign stable data-owner based on initial placement (avoid class-name inference)
function assignOwners() {
    allCards().forEach(card => {
        // If already set, keep it
        if (card.dataset.owner) return;
        if (playerHand.contains(card)) card.dataset.owner = 'player';
        else if (cpuHand.contains(card)) card.dataset.owner = 'cpu';
        else {
            // fallback: nearest hand or default to player
            card.dataset.owner = card.closest('#player-hand') ? 'player' : 'player';
        }
        card.tabIndex = 0; // accessibility
    });
}

// Assign numeric values and render text
function assignValues() {
    allCards().forEach(card => {
        const v = Math.floor(Math.random() * 10) + 1;
        card.dataset.value = String(v);
        card.textContent = v;
    });
}

// Bind UI: delegated clicks and new game button
function bindUI() {
    document.addEventListener('click', (e) => {
        if (isRoundActive) return;
        const card = e.target.closest('.cards');
        if (!card) return;
        // Only allow playing cards that belong to player and are still in playerHand
        if (card.dataset.owner === 'player' && playerHand.contains(card)) {
            playPlayerCard(card);
        }
    });

    if (newGameBtn) newGameBtn.addEventListener('click', resetGame);
}

// Player plays card -> move to play area -> trigger CPU play
function playPlayerCard(card) {
    if (isRoundActive) return;
    isRoundActive = true;
    playArea.appendChild(card);
    // small delay to make UX feel natural
    setTimeout(cpuPlay, 250);
}

// CPU selects a random available CPU card and plays it
function cpuPlay() {
    const available = Array.from(allCards()).filter(c => c.dataset.owner === 'cpu' && cpuHand.contains(c));
    if (available.length === 0) {
        // no CPU cards: evaluate with what's present
        evaluateRound();
        return;
    }
    const pick = available[Math.floor(Math.random() * available.length)];
    playArea.appendChild(pick);
    setTimeout(evaluateRound, 200);
}

// Evaluate round: find one player card and one cpu card in playArea
function evaluateRound() {
    const played = Array.from(playArea.querySelectorAll('.cards'));
    const playerCard = played.find(c => c.dataset.owner === 'player');
    const cpuCard = played.find(c => c.dataset.owner === 'cpu');

    // If both not present, cancel and re-enable
    if (!playerCard || !cpuCard) {
        isRoundActive = false;
        return;
    }

    const p = parseInt(playerCard.dataset.value, 10);
    const c = parseInt(cpuCard.dataset.value, 10);

    if (Number.isNaN(p) || Number.isNaN(c)) {
        showMessage('Invalid card value', 1200);
        // move to discard to avoid stuck state
        moveToDiscard(playerCard);
        moveToDiscard(cpuCard);
        updateDiscardCounts();
        isRoundActive = false;
        return;
    }

    if (p > c) {
        playerScore++;
        renderScores();
        showMessage(`Player wins this round (${p} > ${c})`, 1200);
    } else if (c > p) {
        opponentScore++;
        renderScores();
        showMessage(`CPU wins this round (${c} > ${p})`, 1200);
    } else {
        showMessage(`Tie: ${p} = ${c}`, 1000);
    }

    // After message delay, discard played cards and re-enable
    setTimeout(() => {
        moveToDiscard(playerCard);
        moveToDiscard(cpuCard);
        updateDiscardCounts();
        isRoundActive = false;
    }, 1200);
}

// Move a card element to a hidden discard container in DOM (keeps dataset intact)
function moveToDiscard(card) {
    // create an internal discard container element if needed
    let internal = document.getElementById('internal-discard');
    if (!internal) {
        internal = document.createElement('div');
        internal.id = 'internal-discard';
        internal.style.display = 'none';
        document.body.appendChild(internal);
    }
    if (card && card.parentElement) internal.appendChild(card);
}

// Reset game: move all cards back to owners, reset scores and values
function resetGame() {
    // Move any cards currently in play to internal discard first
    Array.from(playArea.querySelectorAll('.cards')).forEach(c => moveToDiscard(c));

    // Put all cards back to their owner hand
    allCards().forEach(card => {
        if (card.dataset.owner === 'player') playerHand.appendChild(card);
        else if (card.dataset.owner === 'cpu') cpuHand.appendChild(card);
        else playerHand.appendChild(card); // fallback
    });

    playerScore = 0;
    opponentScore = 0;
    renderScores();
    assignValues();
    updateDiscardCounts();
    isRoundActive = false;
    showMessage('New game started', 800);
}

// Render scores
function renderScores() {
    if (playerScoreEl) playerScoreEl.textContent = `Player Score: ${playerScore}`;
    if (opponentScoreEl) opponentScoreEl.textContent = `Opponent Score: ${opponentScore}`;
}

// Update discard counts in the visible discard UI
function updateDiscardCounts() {
    const internal = document.getElementById('internal-discard');
    const cardsInDiscard = internal ? Array.from(internal.querySelectorAll('.cards')) : [];
    const playerCount = cardsInDiscard.filter(c => c.dataset.owner === 'player').length;
    const cpuCount = cardsInDiscard.filter(c => c.dataset.owner === 'cpu').length;
    discardPlayerCountEl.textContent = String(playerCount);
    discardCpuCountEl.textContent = String(cpuCount);
}

// Non-blocking message UI (reused)
let msgEl = null;
function showMessage(text, ms = 1000) {
    if (!msgEl) {
        msgEl = document.createElement('div');
        msgEl.id = 'game-message';
        Object.assign(msgEl.style, {
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            top: '6%',
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            zIndex: '9999',
            fontSize: '14px',
        });
        document.body.appendChild(msgEl);
    }
    msgEl.textContent = text;
    msgEl.style.display = 'block';
    clearTimeout(msgEl._timeout);
    msgEl._timeout = setTimeout(() => { msgEl.style.display = 'none'; }, ms);
}

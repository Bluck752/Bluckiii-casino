/* ============================================================
   BLACKJACK.JS — Standard Blackjack game logic
   ============================================================ */
'use strict';

const Blackjack = (() => {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const SUIT_CLASS = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };

  let deck = [], playerHand = [], dealerHand = [], currentBet = 0, gameActive = false;

  /* ---- DECK ---- */
  function buildDeck() {
    deck = [];
    for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
    // Shuffle (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  function draw() { return deck.pop(); }

  function cardValue(card) {
    if (['J','Q','K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 11;
    return parseInt(card.rank);
  }

  function handScore(hand) {
    let score = 0, aces = 0;
    for (const card of hand) {
      score += cardValue(card);
      if (card.rank === 'A') aces++;
    }
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
  }

  /* ---- RENDERING ---- */
  function renderCard(card, hidden = false) {
    const el = document.createElement('div');
    if (hidden) {
      el.className = 'playing-card card-back';
      el.textContent = '🂠';
      return el;
    }
    el.className = 'playing-card ' + SUIT_CLASS[card.suit];
    el.innerHTML = `
      <div class="card-corner-top"><span class="card-rank">${card.rank}</span><span>${card.suit}</span></div>
      <span class="card-suit">${card.suit}</span>
      <div class="card-corner-bot"><span class="card-rank">${card.rank}</span><span>${card.suit}</span></div>
    `;
    return el;
  }

  function renderHands(hideDealer = true) {
    const pc = document.getElementById('player-cards');
    const dc = document.getElementById('dealer-cards');
    pc.innerHTML = ''; dc.innerHTML = '';

    playerHand.forEach((c, i) => {
      setTimeout(() => { pc.appendChild(renderCard(c)); Audio.deal(); }, i * 200);
    });
    dealerHand.forEach((c, i) => {
      setTimeout(() => {
        dc.appendChild(renderCard(c, hideDealer && i === 1));
        if (!hideDealer || i === 0) Audio.deal();
      }, i * 200 + 100);
    });

    document.getElementById('player-score-label').textContent = `(Score: ${handScore(playerHand)})`;
    document.getElementById('dealer-score-label').textContent = hideDealer ? '(Score: ?)' : `(Score: ${handScore(dealerHand)})`;
  }

  /* ---- GAME FLOW ---- */
  function deal() {
    if (gameActive) return;
    const betInput = document.getElementById('bj-bet');
    const bet = parseInt(betInput.value);
    if (!bet || bet < 1) { UI.toast('⚠️ Enter a valid bet!', 'error'); return; }
    if (bet > State.getBalance()) { UI.toast('❌ Insufficient coins!', 'error'); return; }

    currentBet = bet;
    State.deductCoins(bet);
    UI.updateBalance();

    buildDeck();
    playerHand = [draw(), draw()];
    dealerHand = [draw(), draw()];
    gameActive = true;

    document.getElementById('bj-result-msg').textContent = '';
    document.getElementById('bj-result-msg').className = 'bj-result-msg';
    renderHands(true);

    setButtonState(true);

    // Check for natural blackjack
    setTimeout(() => {
      if (handScore(playerHand) === 21) {
        endGame('blackjack');
      }
    }, 700);
  }

  function hit() {
    if (!gameActive) return;
    playerHand.push(draw());
    Audio.deal();

    const pc = document.getElementById('player-cards');
    pc.appendChild(renderCard(playerHand[playerHand.length - 1]));
    document.getElementById('player-score-label').textContent = `(Score: ${handScore(playerHand)})`;

    if (handScore(playerHand) > 21) endGame('bust');
    else if (handScore(playerHand) === 21) stand();
  }

  function stand() {
    if (!gameActive) return;
    setButtonState(false);

    // Dealer draws
    function dealerDraw() {
      if (handScore(dealerHand) < 17) {
        dealerHand.push(draw());
        // Re-render all dealer cards
        const dc = document.getElementById('dealer-cards');
        dc.innerHTML = '';
        dealerHand.forEach((c, i) => {
          setTimeout(() => { dc.appendChild(renderCard(c)); Audio.deal(); }, i * 150);
        });
        document.getElementById('dealer-score-label').textContent = `(Score: ${handScore(dealerHand)})`;
        setTimeout(dealerDraw, 500);
      } else {
        setTimeout(() => endGame('compare'), 400);
      }
    }

    // Reveal dealer's hidden card
    const dc = document.getElementById('dealer-cards');
    dc.innerHTML = '';
    dealerHand.forEach((c, i) => {
      setTimeout(() => { dc.appendChild(renderCard(c)); if (i === 1) Audio.deal(); }, i * 200);
    });
    document.getElementById('dealer-score-label').textContent = `(Score: ${handScore(dealerHand)})`;
    setTimeout(dealerDraw, 600);
  }

  function doubleDown() {
    if (!gameActive) return;
    if (currentBet > State.getBalance()) { UI.toast('❌ Insufficient coins for double!', 'error'); return; }
    State.deductCoins(currentBet);
    currentBet *= 2;
    UI.updateBalance();
    UI.toast(`Double Down! Bet: ${currentBet.toLocaleString()} 🪙`, 'info', 1500);
    hit();
    if (gameActive) stand();
  }

  function endGame(reason) {
    gameActive = false;
    setButtonState(false);

    const pScore = handScore(playerHand);
    const dScore = handScore(dealerHand);
    const msgEl = document.getElementById('bj-result-msg');

    // Reveal all cards
    const dc = document.getElementById('dealer-cards');
    dc.innerHTML = '';
    dealerHand.forEach((c, i) => setTimeout(() => dc.appendChild(renderCard(c)), i * 150));
    document.getElementById('dealer-score-label').textContent = `(Score: ${dScore})`;

    let won = false, push = false, payout = 0;
    let desc = '';

    if (reason === 'blackjack') {
      payout = Math.floor(currentBet * 2.5);
      won = true;
      desc = '🃏 Blackjack! 21!';
      msgEl.className = 'bj-result-msg win';
    } else if (reason === 'bust') {
      payout = 0;
      desc = `💥 Bust! (${pScore}) — You lose`;
      msgEl.className = 'bj-result-msg loss';
    } else {
      if (dScore > 21 || pScore > dScore) {
        payout = currentBet * 2;
        won = true;
        desc = `🏆 You win! (${pScore} vs ${dScore})`;
        msgEl.className = 'bj-result-msg win';
      } else if (pScore === dScore) {
        payout = currentBet;
        push = true;
        desc = `🤝 Push! (${pScore} = ${dScore}) — Bet returned`;
        msgEl.className = 'bj-result-msg push';
      } else {
        desc = `😔 Dealer wins (${dScore} vs ${pScore})`;
        msgEl.className = 'bj-result-msg loss';
      }
    }

    msgEl.textContent = desc;

    if (payout > 0) State.addCoins(payout);

    const netChange = payout - currentBet;

    if (push) {
      UI.toast(`🤝 Push — Bet returned: ${currentBet.toLocaleString()} 🪙`, 'info', 2500);
      State.addTransaction({ type: 'loss', description: `Blackjack — Push`, amount: 0 });
    } else if (won) {
      State.recordGame(true);
      State.recordEarned(netChange);
      State.addTransaction({ type: 'win', description: `Blackjack — ${desc.replace(/[🃏🏆]/g,'').trim()}`, amount: netChange });
      State.addRecentActivity({ icon: '🃏', game: 'Blackjack', amount: netChange, type: 'win', timestamp: new Date().toISOString() });
      Audio.win();
      UI.confetti(window.innerWidth / 2, 300);
      UI.toast(`🏆 Blackjack Win: +${netChange.toLocaleString()} 🪙!`, 'gold', 3000);
    } else {
      State.recordGame(false);
      State.addTransaction({ type: 'loss', description: `Blackjack — ${desc.replace(/[💥😔]/g,'').trim()}`, amount: -currentBet });
      State.addRecentActivity({ icon: '🃏', game: 'Blackjack', amount: currentBet, type: 'loss', timestamp: new Date().toISOString() });
      Audio.loss();
    }

    UI.updateBalance();
    UI.renderRecentActivity();
  }

  function setButtonState(active) {
    document.getElementById('bj-deal-btn').disabled = active;
    document.getElementById('bj-hit-btn').disabled = !active;
    document.getElementById('bj-stand-btn').disabled = !active;
    document.getElementById('bj-double-btn').disabled = !active;
  }

  function init() {
    document.getElementById('bj-deal-btn').addEventListener('click', deal);
    document.getElementById('bj-hit-btn').addEventListener('click', hit);
    document.getElementById('bj-stand-btn').addEventListener('click', stand);
    document.getElementById('bj-double-btn').addEventListener('click', doubleDown);

    document.querySelectorAll('.bet-preset[data-bj-bet]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('bj-bet').value = btn.dataset.bjBet;
        Audio.click();
      });
    });
  }

  return { init };
})();

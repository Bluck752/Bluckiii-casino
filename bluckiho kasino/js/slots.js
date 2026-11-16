/* ============================================================
   SLOTS.JS — Slot Machine game logic
   ============================================================ */
'use strict';

const Slots = (() => {
  const SYMBOLS = ['🍒', '🍋', '🍉', '🔔', '⭐', '💎', '7️⃣'];
  const WEIGHTS =  [ 20,   16,   12,   10,    8,    5,    3 ];  // out of 74
  const PAYOUTS = {
    '7️⃣7️⃣7️⃣': 50, '💎💎💎': 30, '⭐⭐⭐': 20, '🔔🔔🔔': 15,
    '🍉🍉🍉': 10,  '🍋🍋🍋': 8,  '🍒🍒🍒': 5,
  };

  let spinning = false;
  let reelIntervals = [];

  function weightedRandom() {
    const total = WEIGHTS.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < SYMBOLS.length; i++) {
      r -= WEIGHTS[i];
      if (r < 0) return SYMBOLS[i];
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  function getResult() {
    return [weightedRandom(), weightedRandom(), weightedRandom()];
  }

  function calculatePayout(result, bet) {
    const key = result.join('');
    if (PAYOUTS[key]) return { mult: PAYOUTS[key], win: true };
    // Any pair
    if (result[0]===result[1] || result[1]===result[2] || result[0]===result[2]) {
      return { mult: 1.5, win: true };
    }
    return { mult: 0, win: false };
  }

  function animateReel(reelEl, finalSymbol, delay, duration, cb) {
    let frame = 0;
    const totalFrames = Math.floor(duration / 80);

    const interval = setInterval(() => {
      const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      reelEl.innerHTML = `<div class="reel-symbol">${sym}</div>`;
      frame++;
      if (frame >= totalFrames) {
        clearInterval(interval);
        reelEl.innerHTML = `<div class="reel-symbol">${finalSymbol}</div>`;
        if (cb) cb();
      }
    }, 80);
    return interval;
  }

  function spin() {
    if (spinning) return;
    const betInput = document.getElementById('slot-bet');
    const bet = parseInt(betInput.value);
    if (!bet || bet < 1) { UI.toast('⚠️ Enter a valid bet!', 'error'); return; }
    if (bet > State.getBalance()) { UI.toast('❌ Insufficient coins!', 'error'); return; }

    // Deduct bet
    State.deductCoins(bet);
    UI.updateBalance();
    spinning = true;

    const btn = document.getElementById('slot-spin-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Spinning...';

    const result = getResult();
    document.getElementById('slot-result-msg').textContent = '';
    document.getElementById('slot-result-msg').className = 'slot-result-msg';

    Audio.spin();

    // Animate each reel sequentially
    let done = 0;
    const durations = [800, 1100, 1400];

    for (let i = 0; i < 3; i++) {
      const reel = document.getElementById('reel-' + i);
      const delay = i * 200;
      setTimeout(() => {
        animateReel(reel, result[i], delay, durations[i], () => {
          Audio.click();
          done++;
          if (done === 3) finishSpin(result, bet);
        });
      }, delay);
    }
  }

  function finishSpin(result, bet) {
    spinning = false;
    const btn = document.getElementById('slot-spin-btn');
    btn.disabled = false;
    btn.textContent = '🎰 SPIN!';

    const { mult, win } = calculatePayout(result, bet);
    const msgEl = document.getElementById('slot-result-msg');

    if (win) {
      const winAmount = Math.floor(bet * mult);
      State.addCoins(winAmount);
      State.recordGame(true);
      State.recordEarned(winAmount - bet);
      State.addTransaction({ type: 'win', description: `Slots — ${result.join(' ')} (×${mult})`, amount: winAmount - bet });
      State.addRecentActivity({ icon: '🎰', game: 'Slot Machine', amount: winAmount - bet, type: 'win', timestamp: new Date().toISOString() });

      if (mult >= 20) Audio.bigWin(); else Audio.win();
      UI.confetti(window.innerWidth / 2, 300);

      msgEl.textContent = `🎉 ${result.join(' ')} — ×${mult} — Won ${winAmount.toLocaleString()} 🪙!`;
      msgEl.className = 'slot-result-msg win win-flash';

      UI.toast(`🏆 You won ${winAmount.toLocaleString()} 🪙!`, 'gold', 3000);
    } else {
      State.recordGame(false);
      State.addTransaction({ type: 'loss', description: `Slots — ${result.join(' ')} — No match`, amount: -bet });
      State.addRecentActivity({ icon: '🎰', game: 'Slot Machine', amount: bet, type: 'loss', timestamp: new Date().toISOString() });
      Audio.loss();
      msgEl.textContent = `${result.join(' ')} — No win this time`;
      msgEl.className = 'slot-result-msg loss loss-shake';
    }

    UI.updateBalance();
    UI.renderRecentActivity();
  }

  function init() {
    document.getElementById('slot-spin-btn').addEventListener('click', spin);

    document.querySelectorAll('.bet-preset[data-bet]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('slot-bet').value = btn.dataset.bet;
        Audio.click();
      });
    });

    // Space bar to spin when on games page
    document.addEventListener('keydown', e => {
      if (e.code === 'Space' && document.getElementById('page-games').classList.contains('active')
          && document.getElementById('game-slots').classList.contains('active')) {
        e.preventDefault();
        spin();
      }
    });
  }

  return { init };
})();

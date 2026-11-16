/* ============================================================
   COINFLIP.JS — Coin Flip game logic
   ============================================================ */
'use strict';

const CoinFlip = (() => {
  let selectedSide = 'heads';
  let flipping = false;

  function flip() {
    if (flipping) return;
    const betInput = document.getElementById('cf-bet');
    const bet = parseInt(betInput.value);
    if (!bet || bet < 1) { UI.toast('⚠️ Enter a valid bet!', 'error'); return; }
    if (bet > State.getBalance()) { UI.toast('❌ Insufficient coins!', 'error'); return; }

    State.deductCoins(bet);
    UI.updateBalance();
    flipping = true;

    const btn = document.getElementById('cf-flip-btn');
    btn.disabled = true;
    btn.textContent = '🌀 Flipping...';

    const resultEl = document.getElementById('coinflip-result');
    resultEl.textContent = '';
    resultEl.className = 'coinflip-result';

    const coin = document.getElementById('coin');
    // Determine result
    const result = Math.random() < 0.5 ? 'heads' : 'tails';

    // Animate
    Audio.flip();
    coin.classList.add('flipping');

    // After flip animation
    setTimeout(() => {
      coin.classList.remove('flipping');
      coin.style.transition = 'none';
      // Show final face
      if (result === 'heads') {
        coin.style.transform = 'rotateY(0deg)';
      } else {
        coin.style.transform = 'rotateY(180deg)';
      }
      setTimeout(() => { coin.style.transition = ''; }, 50);

      flipping = false;
      btn.disabled = false;
      btn.textContent = '🪙 FLIP!';

      const won = result === selectedSide;

      if (won) {
        const winAmt = bet * 2;
        State.addCoins(winAmt);
        State.recordGame(true);
        State.recordEarned(bet);
        State.addTransaction({ type: 'win', description: `Coin Flip — ${result.charAt(0).toUpperCase()+result.slice(1)} wins!`, amount: bet });
        State.addRecentActivity({ icon: '🪙', game: 'Coin Flip', amount: bet, type: 'win', timestamp: new Date().toISOString() });
        Audio.win();
        UI.confetti(window.innerWidth / 2, 300);
        resultEl.textContent = `🎉 ${result.toUpperCase()}! You win ${winAmt.toLocaleString()} 🪙!`;
        resultEl.className = 'coinflip-result win';
        UI.toast(`🏆 Coin Flip: Won ${bet.toLocaleString()} 🪙!`, 'gold', 3000);
      } else {
        State.recordGame(false);
        State.addTransaction({ type: 'loss', description: `Coin Flip — ${result.charAt(0).toUpperCase()+result.slice(1)} wins`, amount: -bet });
        State.addRecentActivity({ icon: '🪙', game: 'Coin Flip', amount: bet, type: 'loss', timestamp: new Date().toISOString() });
        Audio.loss();
        resultEl.textContent = `😔 ${result.toUpperCase()} — Better luck next time!`;
        resultEl.className = 'coinflip-result loss';
      }

      UI.updateBalance();
      UI.renderRecentActivity();

      // Reset coin face after 2s
      setTimeout(() => { coin.style.transform = ''; }, 2000);
    }, 1300);
  }

  function init() {
    document.getElementById('cf-flip-btn').addEventListener('click', flip);

    // Side selector
    document.querySelectorAll('.side-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSide = btn.dataset.side;
        Audio.click();
      });
    });

    // Bet presets
    document.querySelectorAll('.bet-preset[data-cf-bet]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('cf-bet').value = btn.dataset.cfBet;
        Audio.click();
      });
    });
  }

  return { init };
})();

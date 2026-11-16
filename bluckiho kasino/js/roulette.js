/* ============================================================
   ROULETTE.JS — European Roulette game logic
   ============================================================ */
'use strict';

const Roulette = (() => {
  // Red numbers on a European roulette wheel
  const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  let selectedBet = { type: 'red', value: null };
  let spinning = false;
  let wheelAngle = 0;
  let animId = null;

  // Wheel segment order (European)
  const WHEEL_ORDER = [
    0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,
    24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
  ];

  function isRed(n) { return RED.has(n); }

  /* ---- CANVAS WHEEL ---- */
  function drawWheel(angle) {
    const canvas = document.getElementById('roulette-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, r = W / 2 - 4;
    const sliceAngle = (2 * Math.PI) / 37;

    ctx.clearRect(0, 0, W, H);

    // Draw rim
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#8b6914';
    ctx.fill();

    for (let i = 0; i < 37; i++) {
      const start = angle + i * sliceAngle;
      const end = start + sliceAngle;
      const num = WHEEL_ORDER[i];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();

      if (num === 0) ctx.fillStyle = '#16a34a';
      else if (isRed(num)) ctx.fillStyle = '#dc2626';
      else ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      ctx.strokeStyle = '#8b6914';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Inter';
      ctx.fillText(String(num), r - 6, 3);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
    grad.addColorStop(0, '#f5c842');
    grad.addColorStop(1, '#c9a227');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function spinWheel(targetNum, onDone) {
    if (animId) cancelAnimationFrame(animId);
    const sliceAngle = (2 * Math.PI) / 37;
    const targetIdx = WHEEL_ORDER.indexOf(targetNum);
    // We want targetIdx slice to end up at the top (angle = -π/2)
    const targetAngle = -Math.PI / 2 - targetIdx * sliceAngle - sliceAngle / 2;
    // Add multiple full rotations for drama
    const fullSpins = 5 + Math.random() * 3;
    const totalAngle = fullSpins * 2 * Math.PI + (targetAngle - (wheelAngle % (2 * Math.PI)));

    const duration = 4000;
    const start = performance.now();
    const startAngle = wheelAngle;

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = easeOut(t);
      wheelAngle = startAngle + totalAngle * eased;
      drawWheel(wheelAngle);
      if (t < 1) {
        animId = requestAnimationFrame(frame);
      } else {
        wheelAngle = wheelAngle % (2 * Math.PI);
        if (onDone) onDone();
      }
    }
    animId = requestAnimationFrame(frame);
  }

  /* ---- BET EVALUATION ---- */
  function evaluateBet(result, bet) {
    const type = bet.type;
    const val = bet.value;
    if (type === 'number') return result === val ? 36 : 0;
    if (type === 'red')    return (result > 0 && isRed(result)) ? 2 : 0;
    if (type === 'black')  return (result > 0 && !isRed(result)) ? 2 : 0;
    if (type === 'even')   return (result > 0 && result % 2 === 0) ? 2 : 0;
    if (type === 'odd')    return (result > 0 && result % 2 !== 0) ? 2 : 0;
    if (type === 'low')    return (result >= 1 && result <= 18) ? 2 : 0;
    if (type === 'high')   return (result >= 19 && result <= 36) ? 2 : 0;
    if (type === 'dozen1') return (result >= 1 && result <= 12) ? 3 : 0;
    if (type === 'dozen2') return (result >= 13 && result <= 24) ? 3 : 0;
    if (type === 'dozen3') return (result >= 25 && result <= 36) ? 3 : 0;
    return 0;
  }

  function getResultColor(n) {
    if (n === 0) return '#22c55e';
    return isRed(n) ? '#ef4444' : '#e2e8f0';
  }

  /* ---- SPIN HANDLER ---- */
  function doSpin() {
    if (spinning) return;
    const betInput = document.getElementById('roulette-bet');
    const betAmt = parseInt(betInput.value);
    if (!betAmt || betAmt < 1) { UI.toast('⚠️ Enter a valid bet!', 'error'); return; }
    if (betAmt > State.getBalance()) { UI.toast('❌ Insufficient coins!', 'error'); return; }

    State.deductCoins(betAmt);
    UI.updateBalance();
    spinning = true;

    const btn = document.getElementById('roulette-spin-btn');
    btn.disabled = true;
    btn.textContent = '🎡 Spinning...';
    document.getElementById('roulette-msg').textContent = '';
    document.getElementById('roulette-msg').className = 'roulette-msg';

    // Pick random result
    const result = Math.floor(Math.random() * 37); // 0-36
    Audio.spin();

    spinWheel(result, () => {
      spinning = false;
      btn.disabled = false;
      btn.textContent = '🎡 SPIN!';

      // Show result
      const rNum = document.getElementById('roulette-result-num');
      rNum.textContent = result;
      rNum.style.color = getResultColor(result);

      const mult = evaluateBet(result, selectedBet);
      const msgEl = document.getElementById('roulette-msg');

      if (mult > 0) {
        const won = Math.floor(betAmt * mult);
        State.addCoins(won);
        State.recordGame(true);
        State.recordEarned(won - betAmt);
        State.addTransaction({ type: 'win', description: `Roulette — #${result} — ×${mult}`, amount: won - betAmt });
        State.addRecentActivity({ icon: '🎡', game: 'Roulette', amount: won - betAmt, type: 'win', timestamp: new Date().toISOString() });
        Audio.win();
        UI.confetti(window.innerWidth / 2, 300);
        msgEl.textContent = `🎉 #${result} — Won ${won.toLocaleString()} 🪙!`;
        msgEl.className = 'roulette-msg win';
        UI.toast(`🏆 Roulette: Won ${won.toLocaleString()} 🪙!`, 'gold', 3000);
      } else {
        State.recordGame(false);
        State.addTransaction({ type: 'loss', description: `Roulette — #${result} — No win`, amount: -betAmt });
        State.addRecentActivity({ icon: '🎡', game: 'Roulette', amount: betAmt, type: 'loss', timestamp: new Date().toISOString() });
        Audio.loss();
        msgEl.textContent = `#${result} — Better luck next time!`;
        msgEl.className = 'roulette-msg loss';
      }

      UI.updateBalance();
      UI.renderRecentActivity();
    });
  }

  /* ---- UI INIT ---- */
  function buildNumberGrid() {
    const grid = document.getElementById('number-bets');
    // Add 1-36
    for (let i = 1; i <= 36; i++) {
      const btn = document.createElement('button');
      btn.className = 'num-btn ' + (isRed(i) ? 'red' : 'black');
      btn.textContent = i;
      btn.dataset.num = i;
      grid.appendChild(btn);
    }
    grid.querySelectorAll('.num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.num-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const num = parseInt(btn.dataset.num);
        selectedBet = { type: 'number', value: num };
        document.getElementById('selected-bet-label').textContent = `Number ${num} (×36)`;
        Audio.click();
      });
    });
  }

  function init() {
    // Draw initial wheel
    drawWheel(0);

    // Build number grid
    buildNumberGrid();

    // Outside bet buttons
    document.querySelectorAll('.roulette-bet-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.roulette-bet-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.betType;
        selectedBet = { type, value: null };
        document.getElementById('selected-bet-label').textContent = btn.textContent;
        Audio.click();
      });
    });

    // Bet type tabs
    document.querySelectorAll('.bet-type-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.bet-type-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const type = tab.dataset.type;
        document.getElementById('outside-bets').classList.toggle('hidden', type !== 'outside');
        document.getElementById('number-bets').classList.toggle('hidden', type !== 'numbers');
        if (type === 'outside') {
          selectedBet = { type: 'red', value: null };
          document.querySelectorAll('.roulette-bet-btn')[0].classList.add('active');
          document.getElementById('selected-bet-label').textContent = '🔴 Red (×2)';
        } else {
          selectedBet = { type: 'number', value: 1 };
          document.getElementById('selected-bet-label').textContent = 'Number 1 (×36)';
        }
        Audio.click();
      });
    });

    document.getElementById('roulette-spin-btn').addEventListener('click', doSpin);
  }

  return { init };
})();

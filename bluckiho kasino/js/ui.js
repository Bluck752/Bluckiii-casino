/* ============================================================
   UI.JS — Navigation, toasts, modals, rendering helpers
   ============================================================ */
'use strict';

const UI = (() => {

  /* ---- NAVIGATION ---- */
  let currentPage = 'home';

  function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');
    const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (navLink) navLink.classList.add('active');
    currentPage = page;
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    updatePageData(page);
    Audio.click();
  }

  function updatePageData(page) {
    if (page === 'home') renderHome();
    if (page === 'history') renderHistory();
    if (page === 'settings') renderSettings();
    if (page === 'wallet') renderWallet();
  }

  /* ---- BALANCE DISPLAY ---- */
  function updateBalance() {
    const bal = State.getBalance();
    const formatted = bal.toLocaleString('cs-CZ');
    document.getElementById('nav-balance').textContent = formatted + ' 🪙';
    document.getElementById('mobile-balance').textContent = formatted + ' 🪙';
    const homeEl = document.getElementById('home-balance');
    if (homeEl) homeEl.textContent = formatted;
    const walletEl = document.getElementById('wallet-balance');
    if (walletEl) walletEl.textContent = formatted;
    homeEl && homeEl.classList.add('balance-tick');
    setTimeout(() => homeEl && homeEl.classList.remove('balance-tick'), 300);
  }

  /* ---- TOAST ---- */
  function toast(msg, type = 'info', duration = 3000) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = msg;
    c.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => t.remove(), 300);
    }, duration);
  }

  /* ---- CONFIRM DIALOG ---- */
  function confirm(title, body) {
    return new Promise(resolve => {
      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-body').textContent = body;
      document.getElementById('confirm-modal').classList.remove('hidden');
      const yes = document.getElementById('confirm-yes');
      const no = document.getElementById('confirm-no');
      function cleanup() {
        document.getElementById('confirm-modal').classList.add('hidden');
        yes.removeEventListener('click', onYes);
        no.removeEventListener('click', onNo);
      }
      function onYes() { cleanup(); resolve(true); }
      function onNo()  { cleanup(); resolve(false); }
      yes.addEventListener('click', onYes);
      no.addEventListener('click', onNo);
    });
  }

  /* ---- CONFETTI ---- */
  function confetti(x, y) {
    const colors = ['#f5c842','#8b5cf6','#22c55e','#ef4444','#60a5fa','#f97316'];
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.cssText = `left:${x + (Math.random()-0.5)*120}px;top:${y}px;background:${colors[Math.floor(Math.random()*colors.length)]};transform:rotate(${Math.random()*360}deg);animation-delay:${Math.random()*0.3}s;animation-duration:${0.8+Math.random()*0.6}s;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }
  }

  /* ---- HOME ---- */
  function renderHome() {
    const s = State.get();
    updateBalance();
    const wins = s.stats.wins;
    const games = s.stats.games;
    document.getElementById('stat-games').textContent  = games.toLocaleString();
    document.getElementById('stat-wins').textContent   = wins.toLocaleString();
    document.getElementById('stat-losses').textContent = s.stats.losses.toLocaleString();
    const wr = games > 0 ? Math.round(wins/games*100) : 0;
    document.getElementById('stat-winrate').textContent = wr + '%';
    renderRecentActivity();
  }

  function renderRecentActivity() {
    const container = document.getElementById('recent-activity');
    const items = State.get().recentActivity;
    if (!items.length) {
      container.innerHTML = '<div class="empty-state">No games played yet. Try your luck! 🎲</div>';
      return;
    }
    container.innerHTML = items.slice(0, 8).map(item => `
      <div class="recent-item">
        <div class="recent-item-left">
          <span class="recent-item-icon">${item.icon}</span>
          <div class="recent-item-info">
            <strong>${item.game}</strong>
            <span>${formatTime(item.timestamp)}</span>
          </div>
        </div>
        <span class="recent-amount ${item.type}">${item.type === 'win' ? '+' : item.type === 'loss' ? '-' : '+'}${item.amount.toLocaleString()} 🪙</span>
      </div>
    `).join('');
  }

  /* ---- HISTORY ---- */
  function renderHistory(filter = 'all') {
    const container = document.getElementById('transaction-list');
    let txs = State.get().transactions;
    if (filter !== 'all') txs = txs.filter(t => t.type === filter);
    if (!txs.length) {
      container.innerHTML = '<div class="empty-state">No transactions found.</div>';
      return;
    }
    const icons = { win: '🏆', loss: '💸', topup: '💰', bonus: '🎁' };
    const labels = { win: 'Win', loss: 'Loss', topup: 'Top Up', bonus: 'Bonus' };
    container.innerHTML = txs.map(tx => `
      <div class="tx-item">
        <div class="tx-left">
          <div class="tx-icon ${tx.type}">${icons[tx.type] || '📋'}</div>
          <div class="tx-desc">
            <strong>${tx.description}</strong>
            <span>${formatDate(tx.timestamp)}</span>
          </div>
        </div>
        <span class="tx-amount ${tx.type}">${tx.amount > 0 ? '+' : ''}${tx.amount.toLocaleString()} 🪙</span>
      </div>
    `).join('');
  }

  /* ---- WALLET ---- */
  function renderWallet() {
    updateBalance();
  }

  /* ---- SETTINGS ---- */
  function renderSettings() {
    const s = State.get();
    const wins = s.stats.wins, games = s.stats.games;
    const wr = games > 0 ? Math.round(wins/games*100) : 0;
    document.getElementById('set-games').textContent  = games.toLocaleString();
    document.getElementById('set-wins').textContent   = wins.toLocaleString();
    document.getElementById('set-losses').textContent = s.stats.losses.toLocaleString();
    document.getElementById('set-winrate').textContent= wr + '%';
    document.getElementById('set-earned').textContent = s.stats.earned.toLocaleString() + ' 🪙';
    // Daily bonus button state
    const btn = document.getElementById('settings-daily-btn');
    const cd  = document.getElementById('daily-countdown');
    if (State.canClaimDailyBonus()) {
      btn.disabled = false;
      cd.textContent = '';
    } else {
      btn.disabled = true;
      cd.textContent = 'Next bonus in ' + (State.getDailyBonusCooldown() || '...');
    }
    // Sound toggle
    document.getElementById('sound-toggle').checked = State.getSetting('sound');
  }

  /* ---- HELPERS ---- */
  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  }
  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('cs-CZ', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  return { navigateTo, updateBalance, toast, confirm, confetti, renderHome, renderHistory, renderWallet, renderSettings, renderRecentActivity, formatDate, formatTime };
})();

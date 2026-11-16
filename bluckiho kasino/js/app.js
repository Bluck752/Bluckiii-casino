/* ============================================================
   APP.JS — Main initialization and event wiring
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ---- INIT ALL MODULES ---- */
  UI.updateBalance();
  Wallet.init();
  Slots.init();
  Roulette.init();
  Blackjack.init();
  CoinFlip.init();
  UI.renderHome();

  /* ---- NAVIGATION ---- */
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      UI.navigateTo(link.dataset.page);
    });
  });

  // "Play Now" buttons on home page and game cards
  document.querySelectorAll('.btn-play, .game-card[data-game]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const game = el.dataset.game || el.closest('[data-game]')?.dataset.game;
      if (!game) return;
      UI.navigateTo('games');
      setTimeout(() => activateGameTab(game), 50);
    });
  });

  /* ---- GAME TABS ---- */
  document.querySelectorAll('.game-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activateGameTab(tab.dataset.game);
      Audio.click();
    });
  });

  function activateGameTab(game) {
    document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
    const tab = document.querySelector(`.game-tab[data-game="${game}"]`);
    const panel = document.getElementById('game-' + game);
    if (tab) tab.classList.add('active');
    if (panel) panel.classList.add('active');
  }

  /* ---- HISTORY FILTER ---- */
  document.getElementById('history-filter').addEventListener('change', e => {
    UI.renderHistory(e.target.value);
  });

  document.getElementById('clear-history-btn').addEventListener('click', async () => {
    const yes = await UI.confirm('Clear History', 'Are you sure you want to clear all transaction history? This cannot be undone.');
    if (yes) {
      State.get().transactions = [];
      State.save();
      UI.renderHistory();
      UI.toast('🗑 Transaction history cleared.', 'info');
    }
  });

  /* ---- SETTINGS ---- */
  document.getElementById('sound-toggle').addEventListener('change', e => {
    State.setSetting('sound', e.target.checked);
    UI.toast(e.target.checked ? '🔊 Sound enabled' : '🔇 Sound disabled', 'info', 2000);
  });

  document.getElementById('reset-account-btn').addEventListener('click', async () => {
    const yes = await UI.confirm(
      '⚠️ Reset Account',
      'This will reset your balance to 500 coins and erase all history and stats. Are you sure?'
    );
    if (yes) {
      State.resetAccount();
      UI.updateBalance();
      UI.renderHome();
      UI.renderSettings();
      UI.toast('🔄 Account reset to default.', 'info', 3000);
      UI.navigateTo('home');
    }
  });

  /* ---- MOBILE SIDEBAR ---- */
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Close sidebar on outside click
  document.addEventListener('click', e => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && e.target !== document.getElementById('mobile-menu-btn')) {
        sidebar.classList.remove('open');
      }
    }
  });

  /* ---- CLOSE MODALS ON OVERLAY CLICK ---- */
  document.getElementById('checkout-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('checkout-modal')) {
      document.getElementById('checkout-modal').classList.add('hidden');
    }
  });

  /* ---- DAILY BONUS CHECK ON LOAD ---- */
  if (State.canClaimDailyBonus() && State.get().transactions.length > 0) {
    setTimeout(() => {
      UI.toast('🎁 Daily bonus available! Claim it on the Home page.', 'gold', 5000);
    }, 1500);
  }

  /* ---- RENDER SETTINGS PAGE ---- */
  UI.renderSettings();

  /* ---- INPUT VALIDATION — prevent non-numeric / negative bets ---- */
  document.querySelectorAll('.bet-input').forEach(input => {
    input.addEventListener('input', () => {
      const val = parseInt(input.value);
      if (isNaN(val) || val < 1) input.value = '';
    });
    input.addEventListener('keydown', e => {
      // Allow: backspace, delete, tab, arrows, ctrl shortcuts
      if ([8,9,37,38,39,40,46].includes(e.keyCode)) return;
      // Allow: Ctrl+A/C/V/X
      if (e.ctrlKey && [65,67,86,88].includes(e.keyCode)) return;
      // Block non-digits
      if (e.key < '0' || e.key > '9') e.preventDefault();
    });
  });
  document.addEventListener('keydown', e => {
    if (e.altKey) {
      const map = { '1':'home', '2':'games', '3':'wallet', '4':'history', '5':'settings' };
      if (map[e.key]) { UI.navigateTo(map[e.key]); e.preventDefault(); }
    }
  });

  console.log('%c🎰 Bluckiii\'s Casino Loaded!', 'color:#f5c842;font-size:18px;font-weight:bold');
  console.log('%c⚠️ SIMULATOR — No real money involved.', 'color:#8b5cf6;font-size:12px');
});

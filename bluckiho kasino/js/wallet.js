/* ============================================================
   WALLET.JS — Coin top-up, checkout modal logic
   ============================================================ */
'use strict';

const Wallet = (() => {
  let pendingAmount = 0;

  function openCheckout(amount) {
    if (!amount || amount < 1) {
      UI.toast('⚠️ Enter a valid amount!', 'error');
      return;
    }
    pendingAmount = amount;
    document.getElementById('checkout-item').textContent = amount.toLocaleString() + ' Coins Pack';
    document.getElementById('checkout-modal').classList.remove('hidden');
    Audio.click();
  }

  function confirmPayment() {
    const amount = pendingAmount;
    document.getElementById('checkout-modal').classList.add('hidden');

    // Add coins
    State.addCoins(amount);
    State.addTransaction({
      type: 'topup',
      description: `Top Up — ${amount.toLocaleString()} Coins`,
      amount: amount,
    });

    UI.updateBalance();
    Audio.topup();

    // Confetti burst
    setTimeout(() => {
      UI.confetti(window.innerWidth / 2, window.innerHeight / 3);
    }, 100);

    UI.toast(`🎉 +${amount.toLocaleString()} 🪙 Coins added to your balance!`, 'gold', 4000);

    pendingAmount = 0;
  }

  function claimDailyBonus() {
    if (!State.canClaimDailyBonus()) {
      UI.toast(`⏳ Come back in ${State.getDailyBonusCooldown()}`, 'info');
      return;
    }
    const BONUS = 50;
    State.claimDailyBonus();
    State.addCoins(BONUS);
    State.addTransaction({
      type: 'bonus',
      description: 'Daily Bonus Claimed',
      amount: BONUS,
    });
    State.addRecentActivity({ icon: '🎁', game: 'Daily Bonus', amount: BONUS, type: 'bonus', timestamp: new Date().toISOString() });
    UI.updateBalance();
    Audio.bonus();
    UI.confetti(window.innerWidth / 2, 200);
    UI.toast(`🎁 Daily Bonus: +${BONUS} 🪙 Coins! Come back tomorrow for more!`, 'gold', 4000);
    UI.renderSettings();
  }

  function init() {
    // Wallet preset buttons
    document.querySelectorAll('.topup-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = parseInt(btn.dataset.amount);
        openCheckout(amount);
      });
    });

    // Custom amount
    document.getElementById('custom-topup-btn').addEventListener('click', () => {
      const val = parseInt(document.getElementById('custom-amount').value);
      if (!val || val < 1) { UI.toast('⚠️ Enter a valid positive amount!', 'error'); return; }
      openCheckout(val);
    });
    document.getElementById('custom-amount').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('custom-topup-btn').click();
    });

    // Checkout modal
    document.getElementById('confirm-payment-btn').addEventListener('click', confirmPayment);
    document.getElementById('cancel-payment-btn').addEventListener('click', () => {
      document.getElementById('checkout-modal').classList.add('hidden');
      pendingAmount = 0;
    });
    document.getElementById('modal-close').addEventListener('click', () => {
      document.getElementById('checkout-modal').classList.add('hidden');
      pendingAmount = 0;
    });

    // Home top-up button
    document.getElementById('home-topup-btn').addEventListener('click', () => UI.navigateTo('wallet'));

    // Daily bonus
    document.getElementById('daily-bonus-btn').addEventListener('click', claimDailyBonus);
    document.getElementById('settings-daily-btn').addEventListener('click', claimDailyBonus);
  }

  return { init, openCheckout, claimDailyBonus };
})();

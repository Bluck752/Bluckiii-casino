/* ============================================================
   STATE.JS — Central store with localStorage persistence
   ============================================================ */
'use strict';

const DEFAULT_STATE = {
  balance: 500,         // start with 500 coins
  stats: { games: 0, wins: 0, losses: 0, earned: 0 },
  transactions: [],
  recentActivity: [],
  lastDailyBonus: null,
  settings: { sound: true },
};

const State = (() => {
  const STORAGE_KEY = 'bluckiii_casino_v1';

  let _state = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      _state = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_STATE));
      // Merge any missing keys from default
      _state = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), _state);
      _state.stats = Object.assign({}, DEFAULT_STATE.stats, _state.stats);
      _state.settings = Object.assign({}, DEFAULT_STATE.settings, _state.settings);
    } catch (e) {
      _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_state)); } catch(e) {}
  }

  function get() { return _state; }

  function getBalance() { return _state.balance; }

  function addCoins(amount, skipSave = false) {
    _state.balance = Math.max(0, _state.balance + amount);
    if (!skipSave) save();
  }

  function deductCoins(amount) {
    if (_state.balance < amount) return false;
    _state.balance -= amount;
    save();
    return true;
  }

  function addTransaction(tx) {
    tx.id = Date.now() + Math.random();
    tx.timestamp = new Date().toISOString();
    _state.transactions.unshift(tx);
    if (_state.transactions.length > 200) _state.transactions = _state.transactions.slice(0, 200);
    save();
  }

  function addRecentActivity(item) {
    _state.recentActivity.unshift(item);
    if (_state.recentActivity.length > 10) _state.recentActivity = _state.recentActivity.slice(0, 10);
    save();
  }

  function recordGame(won) {
    _state.stats.games++;
    if (won) _state.stats.wins++;
    else _state.stats.losses++;
    save();
  }

  function recordEarned(amount) {
    _state.stats.earned += amount;
    save();
  }

  function canClaimDailyBonus() {
    if (!_state.lastDailyBonus) return true;
    const last = new Date(_state.lastDailyBonus);
    const now = new Date();
    return (now - last) >= 24 * 60 * 60 * 1000;
  }

  function claimDailyBonus() {
    _state.lastDailyBonus = new Date().toISOString();
    save();
  }

  function getDailyBonusCooldown() {
    if (!_state.lastDailyBonus) return null;
    const last = new Date(_state.lastDailyBonus);
    const next = new Date(last.getTime() + 24 * 60 * 60 * 1000);
    const diff = next - new Date();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  function resetAccount() {
    _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    save();
  }

  function getSetting(key) { return _state.settings[key]; }
  function setSetting(key, value) { _state.settings[key] = value; save(); }

  load();
  return { get, getBalance, addCoins, deductCoins, addTransaction, addRecentActivity,
           recordGame, recordEarned, canClaimDailyBonus, claimDailyBonus,
           getDailyBonusCooldown, resetAccount, getSetting, setSetting, save };
})();

/* ============================================================
   AUDIO.JS — Web Audio API sound effects
   ============================================================ */
'use strict';

const Audio = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return ctx;
  }

  function enabled() { return State.getSetting('sound'); }

  function beep(freq, duration, type = 'sine', gain = 0.3) {
    if (!enabled()) return;
    const c = getCtx();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const vol = c.createGain();
      osc.connect(vol);
      vol.connect(c.destination);
      osc.frequency.value = freq;
      osc.type = type;
      vol.gain.setValueAtTime(gain, c.currentTime);
      vol.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration);
    } catch(e) {}
  }

  function chord(freqs, duration, gain = 0.2) {
    freqs.forEach((f, i) => setTimeout(() => beep(f, duration, 'sine', gain), i * 60));
  }

  return {
    win()      { chord([523, 659, 784, 1047], 0.5, 0.25); },
    bigWin()   { chord([523,659,784,1047,1319], 0.8, 0.3); setTimeout(() => chord([784,988,1175], 0.6), 500); },
    loss()     { beep(220, 0.4, 'sawtooth', 0.15); setTimeout(() => beep(180, 0.4, 'sawtooth', 0.1), 200); },
    spin()     { for(let i=0;i<6;i++) setTimeout(()=>beep(200+i*40, 0.07,'square',0.1), i*80); },
    click()    { beep(600, 0.08, 'sine', 0.15); },
    coin()     { beep(900, 0.15, 'sine', 0.2); setTimeout(()=>beep(1200,0.1,'sine',0.15),80); },
    flip()     { for(let i=0;i<8;i++) setTimeout(()=>beep(400+Math.random()*400,0.05,'square',0.1), i*100); },
    deal()     { beep(440, 0.1, 'triangle', 0.2); },
    bonus()    { chord([523,659,784,988,1175,1319], 0.6, 0.2); },
    topup()    { chord([523,659,784,1047], 0.5, 0.3); setTimeout(()=>chord([784,988,1047],0.4), 400); },
  };
})();

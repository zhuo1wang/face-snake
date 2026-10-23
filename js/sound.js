/**
 * 简易音效（Web Audio，无需音频文件）
 */

let ctx = null;
let enabled = true;

export function setSoundEnabled(on) {
  enabled = !!on;
}

export function isSoundEnabled() {
  return enabled;
}

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** 需在用户手势后调用，解锁自动播放限制 */
export function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
}

function tone({ freq = 440, duration = 0.08, type = "sine", gain = 0.04, slideTo = null }) {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + duration);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playEat() {
  tone({ freq: 660, duration: 0.07, type: "triangle", gain: 0.05 });
  setTimeout(() => tone({ freq: 880, duration: 0.06, type: "triangle", gain: 0.035 }), 40);
}

export function playDie() {
  tone({ freq: 220, duration: 0.28, type: "sawtooth", gain: 0.045, slideTo: 80 });
}

export function playClick() {
  tone({ freq: 520, duration: 0.04, type: "square", gain: 0.025 });
}

export function playStart() {
  tone({ freq: 392, duration: 0.06, type: "sine", gain: 0.04 });
  setTimeout(() => tone({ freq: 523, duration: 0.08, type: "sine", gain: 0.04 }), 70);
}

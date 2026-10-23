const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const KEY_MAP = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  s: "down",
  S: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
};

/**
 * @param {object} opts
 * @param {(dir:{x:number,y:number})=>void} opts.onDirection
 * @param {HTMLElement} opts.swipeTarget
 * @param {number} [opts.swipeThreshold=24]
 */
export function createInput({ onDirection, swipeTarget, swipeThreshold = 24 }) {
  let touchStart = null;

  function emit(name) {
    const dir = DIRS[name];
    if (dir) onDirection(dir);
  }

  function onKeyDown(e) {
    const name = KEY_MAP[e.key];
    if (!name) return;
    e.preventDefault();
    emit(name);
  }

  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }

  function onTouchMove(e) {
    // 防止页面跟着滑
    if (touchStart) e.preventDefault();
  }

  function onTouchEnd(e) {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.hypot(dx, dy) < swipeThreshold) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      emit(dx > 0 ? "right" : "left");
    } else {
      emit(dy > 0 ? "down" : "up");
    }
  }

  window.addEventListener("keydown", onKeyDown);
  swipeTarget.addEventListener("touchstart", onTouchStart, { passive: true });
  swipeTarget.addEventListener("touchmove", onTouchMove, { passive: false });
  swipeTarget.addEventListener("touchend", onTouchEnd, { passive: true });

  return {
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      swipeTarget.removeEventListener("touchstart", onTouchStart);
      swipeTarget.removeEventListener("touchmove", onTouchMove);
      swipeTarget.removeEventListener("touchend", onTouchEnd);
    },
  };
}

export { DIRS };

/**
 * Seeded Mulberry32 generator: the same seed always gives the same stream, so the demo is reproducible.
 * `next()` is uniform in [0, 1); `next.norm()` is standard normal; `next.pick(items, weights)` is a weighted draw.
 */
export function rng(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.norm = () => Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
  next.pick = (items, weights) => {
    let x = next() * weights.reduce((sum, w) => sum + w, 0);
    for (let i = 0; i < items.length; i++) {
      x -= weights[i];
      if (x <= 0) return items[i];
    }
    return items[items.length - 1];
  };
  return next;
}

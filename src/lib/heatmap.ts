export function normalizeFrequencies(
  frequencies: Record<string, number>,
): Record<string, number> {
  const values = Object.values(frequencies);
  if (values.length === 0) return {};

  const max = Math.max(...values);
  if (max === 0) return Object.fromEntries(Object.keys(frequencies).map((k) => [k, 0]));

  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(frequencies)) {
    result[key] = val / max;
  }
  return result;
}

/** Interpolate green -> yellow -> red based on 0-1 value. */
export function interpolateHeatColor(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));

  let r: number, g: number, b: number;
  if (clamped < 0.5) {
    const t = clamped * 2;
    r = Math.round(100 + t * 155);
    g = Math.round(200 - t * 50);
    b = Math.round(80 - t * 40);
  } else {
    const t = (clamped - 0.5) * 2;
    r = 255;
    g = Math.round(150 - t * 110);
    b = Math.round(40 - t * 20);
  }

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

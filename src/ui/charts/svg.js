// Tiny SVG string builders shared by the charts. Attribute values are numbers or internal strings.

const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");

export const line = (x1, y1, x2, y2, stroke, width = 1, extra = {}) =>
  `<line ${attrs({ x1, y1, x2, y2, stroke, "stroke-width": width, ...extra })}/>`;

export const text = (x, y, content, { fill, size = 11, anchor, weight, transform, events } = {}) =>
  `<text ${attrs({ x, y, fill, "font-size": size, "font-weight": weight, "text-anchor": anchor, transform, "pointer-events": events })}>${content}</text>`;

export const polyline = (points, stroke) =>
  `<polyline points="${points.join(" ")}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;

export const rect = (x, y, width, height, extra = {}) => `<rect ${attrs({ x, y, width, height, ...extra })}/>`;

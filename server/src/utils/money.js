export const num = (value) => (value == null ? 0 : Number(value));

export const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const sumBy = (arr, selector) =>
  round2(arr.reduce((total, item) => total + Number(selector(item) || 0), 0));

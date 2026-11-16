const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[";\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export function toCSV(headers, rows) {
  const lines = [
    headers.map(escapeCell).join(';'),
    ...rows.map((row) => row.map(escapeCell).join(';')),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

export function sendCSV(res, filename, content) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(content);
}

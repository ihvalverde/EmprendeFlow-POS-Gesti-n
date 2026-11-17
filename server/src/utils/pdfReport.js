import PDFDocument from 'pdfkit';
import { boldFontBuffer, regularFontBuffer } from '../lib/fonts.js';
import { logoBuffer } from '../lib/logo.js';

const PAGE = { size: 'A4', layout: 'landscape', margin: 36 };
const MARGIN = 36;
const ROW_HEIGHT = 22;

const COLORS = {
  ink: '#0F172A',
  slate: '#334155',
  muted: '#64748B',
  line: '#E2E8F0',
  softSlate: '#F8FAFC',
  white: '#FFFFFF',
  deep: '#312E81',
  indigo: '#4F46E5',
  indigoDeep: '#3730A3',
  softIndigo: '#EEF2FF',
  violet: '#8B5CF6',
  softViolet: '#F5F3FF',
  amber: '#F59E0B',
  softAmber: '#FFFBEB',
  emerald: '#10B981',
  softEmerald: '#ECFDF5',
  sky: '#0EA5E9',
  softSky: '#F0F9FF',
  rose: '#F43F5E',
  softRose: '#FFF1F2',
};

const TONES = {
  indigo: { accent: COLORS.indigo, soft: COLORS.softIndigo },
  violet: { accent: COLORS.violet, soft: COLORS.softViolet },
  amber: { accent: COLORS.amber, soft: COLORS.softAmber },
  emerald: { accent: COLORS.emerald, soft: COLORS.softEmerald },
  sky: { accent: COLORS.sky, soft: COLORS.softSky },
  rose: { accent: COLORS.rose, soft: COLORS.softRose },
  slate: { accent: COLORS.slate, soft: COLORS.softSlate },
};

const generatedFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  dateStyle: 'medium',
  timeStyle: 'short',
});

function drawHeader(doc, report) {
  const { width } = doc.page;

  doc.save();
  doc.rect(0, 0, width, 104).fill(COLORS.deep);
  doc.fillColor(COLORS.indigo).fillOpacity(0.35).circle(width - 88, -16, 132).fill();
  doc.fillColor(COLORS.violet).fillOpacity(0.18).circle(width - 250, 142, 150).fill();
  doc.restore();

  doc.save();
  doc.roundedRect(MARGIN, 23, 58, 58, 14).fill(COLORS.white);
  doc.roundedRect(MARGIN, 23, 58, 58, 14).clip();
  doc.image(logoBuffer, MARGIN, 23, { width: 58, height: 58 });
  doc.restore();

  doc
    .font('JakartaBold')
    .fontSize(7)
    .fillColor('#A5B4FC')
    .text('REPORTE', MARGIN + 74, 18, { characterSpacing: 1.2, lineBreak: false });

  doc
    .font('JakartaBold')
    .fontSize(19)
    .fillColor(COLORS.white)
    .text(report.title, MARGIN + 74, 28, {
      width: width - MARGIN * 2 - 292,
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .font('Jakarta')
    .fontSize(8.6)
    .fillColor('#C7D2FE')
    .text(report.subtitle, MARGIN + 74, 55, {
      width: width - MARGIN * 2 - 292,
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .font('JakartaBold')
    .fontSize(10.5)
    .fillColor(COLORS.white)
    .text(report.businessName || 'EmprendeFlow', width - MARGIN - 220, 30, {
      width: 220,
      align: 'right',
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .font('Jakarta')
    .fontSize(8)
    .fillColor('#C7D2FE')
    .text(`Generado: ${generatedFormatter.format(new Date())}`, width - MARGIN - 220, 53, {
      width: 220,
      align: 'right',
      lineBreak: false,
    });
}

function drawSummary(doc, summary, y) {
  const contentWidth = doc.page.width - MARGIN * 2;
  const gap = 10;
  const cardWidth = (contentWidth - gap * (summary.length - 1)) / summary.length;
  const height = 54;

  summary.forEach((item, index) => {
    const x = MARGIN + index * (cardWidth + gap);
    const tone = TONES[item.tone] || TONES.indigo;

    doc.save();
    doc.roundedRect(x, y, cardWidth, height, 10).fillAndStroke(tone.soft, COLORS.line);
    doc.roundedRect(x, y, 4, height, 2).fill(tone.accent);
    doc.restore();

    doc
      .font('JakartaBold')
      .fontSize(6.5)
      .fillColor(COLORS.muted)
      .text(item.label.toUpperCase(), x + 14, y + 11, {
        width: cardWidth - 26,
        characterSpacing: 0.6,
        lineBreak: false,
        ellipsis: true,
      });

    doc
      .font('JakartaBold')
      .fontSize(13)
      .fillColor(COLORS.ink)
      .text(item.value, x + 14, y + 25, {
        width: cardWidth - 26,
        lineBreak: false,
        ellipsis: true,
      });
  });

  return y + height;
}

function normalizeColumns(columns, contentWidth) {
  const total = columns.reduce((sum, column) => sum + column.width, 0);
  const scale = contentWidth / total;
  return columns.map((column) => ({ ...column, width: column.width * scale }));
}

function drawTableHeader(doc, columns, y) {
  const contentWidth = doc.page.width - MARGIN * 2;
  doc.rect(MARGIN, y, contentWidth, 25).fill(COLORS.indigoDeep);

  let x = MARGIN;
  for (const column of columns) {
    doc
      .font('JakartaBold')
      .fontSize(6.2)
      .fillColor(COLORS.white)
      .text(column.label.toUpperCase(), x + 6, y + 9.5, {
        width: column.width - 12,
        align: column.align || 'left',
        lineBreak: false,
        ellipsis: true,
      });
    x += column.width;
  }

  return y + 25;
}

function measureRowHeight(doc, columns, row) {
  let maxHeight = 0;

  columns.forEach((column, columnIndex) => {
    doc.font(columnIndex === 0 ? 'JakartaBold' : 'Jakarta').fontSize(7.2);
    const height = doc.heightOfString(String(row[column.index] ?? '—'), {
      width: column.width - 12,
      lineGap: 0.5,
    });
    if (height > maxHeight) maxHeight = height;
  });

  return Math.max(ROW_HEIGHT, Math.min(32, maxHeight + 8));
}

function drawRow(doc, columns, row, y, index, rowHeight) {
  const contentWidth = doc.page.width - MARGIN * 2;
  doc.rect(MARGIN, y, contentWidth, rowHeight).fill(index % 2 === 0 ? COLORS.white : COLORS.softSlate);

  let x = MARGIN;
  columns.forEach((column, columnIndex) => {
    const text = row[column.index] ?? '—';
    doc
      .font(columnIndex === 0 ? 'JakartaBold' : 'Jakarta')
      .fontSize(7.2)
      .fillColor(columnIndex === 0 ? COLORS.ink : COLORS.slate)
      .text(String(text), x + 6, y + 5.5, {
        width: column.width - 12,
        height: rowHeight - 8,
        align: column.align || 'left',
        ellipsis: true,
      });
    x += column.width;
  });

  doc
    .moveTo(MARGIN, y + rowHeight)
    .lineTo(doc.page.width - MARGIN, y + rowHeight)
    .strokeColor(COLORS.line)
    .lineWidth(0.4)
    .stroke();

  return y + rowHeight;
}

function drawContinuationHeader(doc, title) {
  const contentWidth = doc.page.width - MARGIN * 2;
  doc.rect(0, 0, doc.page.width, 44).fill(COLORS.deep);
  doc
    .font('JakartaBold')
    .fontSize(9)
    .fillColor(COLORS.white)
    .text(`${title} · continuación`, MARGIN, 17, {
      width: contentWidth,
      lineBreak: false,
      ellipsis: true,
    });
  return 58;
}

function drawEmptyState(doc, y) {
  const contentWidth = doc.page.width - MARGIN * 2;
  doc.roundedRect(MARGIN, y, contentWidth, 74, 10).fillAndStroke(COLORS.softSlate, COLORS.line);
  doc
    .font('JakartaBold')
    .fontSize(11)
    .fillColor(COLORS.ink)
    .text('Sin registros para este reporte', MARGIN + 20, y + 23, {
      width: contentWidth - 40,
      align: 'center',
    });
  doc
    .font('Jakarta')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text('Prueba con otro rango de fechas o filtro.', MARGIN + 20, y + 44, {
      width: contentWidth - 40,
      align: 'center',
    });
}

function drawFooters(doc, report) {
  const range = doc.bufferedPageRange();
  const pages = range.count;

  for (let index = 0; index < pages; index += 1) {
    doc.switchToPage(range.start + index);
    doc.page.margins.bottom = 0;
    const y = doc.page.height - 30;

    doc
      .moveTo(MARGIN, y)
      .lineTo(doc.page.width - MARGIN, y)
      .strokeColor(COLORS.line)
      .lineWidth(0.5)
      .stroke();

    doc
      .font('Jakarta')
      .fontSize(6.8)
      .fillColor(COLORS.muted)
      .text('EmprendeFlow POS & Gestión · Reporte generado automáticamente', MARGIN, y + 7, {
        width: doc.page.width - MARGIN * 2 - 100,
        lineBreak: false,
        ellipsis: true,
      });

    doc.text(`Página ${index + 1} de ${pages}`, doc.page.width - MARGIN - 90, y + 7, {
      width: 90,
      align: 'right',
    });
  }

  doc.flushPages();
}

export function streamReportPDF(res, report) {
  const doc = new PDFDocument({
    ...PAGE,
    bufferPages: true,
    info: {
      Title: report.title,
      Author: report.businessName || 'EmprendeFlow',
      Subject: report.subtitle,
      Creator: 'EmprendeFlow POS & Gestión',
    },
  });

  doc.registerFont('Jakarta', regularFontBuffer);
  doc.registerFont('JakartaBold', boldFontBuffer);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
  doc.pipe(res);

  drawHeader(doc, report);

  let y = 121;
  y = drawSummary(doc, report.summary, y) + 18;

  const contentWidth = doc.page.width - MARGIN * 2;
  const columns = normalizeColumns(report.columns, contentWidth);

  y = drawTableHeader(doc, columns, y);

  if (report.rows.length === 0) {
    drawEmptyState(doc, y);
  } else {
    report.rows.forEach((row, index) => {
      const rowHeight = measureRowHeight(doc, columns, row);

      if (y + rowHeight > doc.page.height - 46) {
        doc.addPage(PAGE);
        y = drawContinuationHeader(doc, report.title);
        y = drawTableHeader(doc, columns, y);
      }
      y = drawRow(doc, columns, row, y, index, rowHeight);
    });
  }

  drawFooters(doc, report);
  doc.end();
}

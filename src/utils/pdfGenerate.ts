import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';

export async function generateOptimizedPDF(
  resumeText: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_WIDTH = 595;  // A4
  const PAGE_HEIGHT = 842;
  const MARGIN = 50;
  const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const LINE_HEIGHT = 14;
  const SECTION_GAP = 10;

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const addPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const checkY = (needed: number) => {
    if (y - needed < MARGIN) addPage();
  };

  // Wrap text into lines
  const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      const w = font.widthOfTextAtSize(test, fontSize);
      if (w > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const drawText = (text: string, font: PDFFont, size: number, color = rgb(0.1, 0.1, 0.1)) => {
    const lines = wrapText(text, font, size, MAX_WIDTH);
    for (const line of lines) {
      checkY(size + 4);
      page.drawText(line, { x: MARGIN, y, font, size, color });
      y -= size + 4;
    }
  };

  const drawHRule = () => {
    checkY(10);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.6, 0.7, 0.9),
    });
    y -= 8;
  };

  const drawSectionHeader = (title: string) => {
    checkY(32);
    y -= SECTION_GAP;
    drawText(title.toUpperCase(), boldFont, 10, rgb(0.31, 0.55, 0.97)); // Sligtly larger header
    drawHRule();
    y -= 4; // Spacing after rule and before section content
  };

  // Parse and render sections
  const normalizedText = resumeText
    .replace(/\\n/g, '\n')
    .replace(/^#+\s+/gm, '');
    
  const lines = normalizedText.split('\n');
  let currentSection = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      y -= 8;
      continue;
    }

    // Detect section headers (ALL CAPS lines or lines ending with :)
    const isSectionHeader =
      /^[A-ZÁÉÍÓÚÀÂÊÎÔÛÃÕÇ\s\/&]{4,60}$/.test(line) ||
      /^(RESUMO|OBJETIVO|EXPERIÊNCIA|EXPERIENCIA|FORMAÇÃO|FORMACAO|COMPETÊNCIAS|COMPETENCIAS|SKILLS|HABILIDADES|EDUCAÇÃO|EDUCACAO|CONTATO|CERTIFICAÇÕES|CERTIFICACOES|PROJETOS|IDIOMAS|LANGUAGES|SUMMARY|EXPERIENCE|EDUCATION|CONTACT|SKILLS|CERTIFICATIONS|PROJECTS)/i.test(line);

    if (isSectionHeader) {
      currentSection = line.toUpperCase();
      y -= 12; // Extra gap before new section
      drawSectionHeader(line);
    } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      const bullet = line.replace(/^[•\-\*]\s*/, '');
      const bulletLines = wrapText(`• ${bullet}`, regularFont, 9.5, MAX_WIDTH - 12);
      for (let i = 0; i < bulletLines.length; i++) {
        checkY(14);
        page.drawText(bulletLines[i], {
          x: MARGIN + (i === 0 ? 0 : 12),
          y,
          font: regularFont,
          size: 9.5,
          color: rgb(0.15, 0.15, 0.2),
        });
        y -= LINE_HEIGHT;
      }
    } else if (currentSection.includes('EXPERIÊNCIA') || currentSection.includes('EXPERIENCE')) {
      // Within Work Experience section: Bold dates and job titles
      const isTitle = (/^\d{4}/.test(line) || (!line.endsWith('.') && line.length < 100 && (line.includes('|') || line.includes(' - ') || line.includes(' – '))));
      
      if (isTitle) {
        checkY(18);
        y -= 2; // extra spacing before job headings
        drawText(line, boldFont, 11, rgb(0, 0, 0));
      } else {
        checkY(14);
        drawText(line, regularFont, 9.5, rgb(0.15, 0.15, 0.2));
      }
    } else {
      checkY(14);
      drawText(line, regularFont, 9.5, rgb(0.15, 0.15, 0.2));
    }
  }

  return pdfDoc.save();
}

export function downloadPDF(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

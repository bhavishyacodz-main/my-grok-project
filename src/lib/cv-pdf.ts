import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CvDocument, CvStyle } from "@/lib/types";
import { clip } from "@/lib/hiring-rules";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

type Cursor = { page: PDFPage; y: number; doc: PDFDocument; font: PDFFont; bold: PDFFont };

function pdfText(value: unknown, max: number): string {
  return clip(value, max).replace(/[^\t\n\r\x20-\x7E\u00A0-\u00FF]/g, "?");
}

function ensure(cursor: Cursor, needed: number): Cursor {
  if (cursor.y - needed > 48) return cursor;
  const page = cursor.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { ...cursor, page, y: PAGE_HEIGHT - MARGIN };
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function paragraph(cursor: Cursor, text: string, size = 10.5, gap = 4): Cursor {
  const clean = pdfText(text, 4000);
  if (!clean) return cursor;
  let current = cursor;
  for (const source of clean.split(/\n+/)) {
    for (const line of wrap(source, current.font, size, PAGE_WIDTH - MARGIN * 2)) {
      current = ensure(current, size + gap);
      current.page.drawText(line, {
        x: MARGIN,
        y: current.y - size,
        size,
        font: current.font,
        color: rgb(0.09, 0.13, 0.11),
      });
      current = { ...current, y: current.y - size - gap };
    }
  }
  return current;
}

function heading(cursor: Cursor, label: string, style: CvStyle): Cursor {
  let current = ensure(cursor, 28);
  current = { ...current, y: current.y - 8 };
  const size = style === "minimal" ? 11 : 12;
  current.page.drawText(label.toUpperCase(), {
    x: MARGIN,
    y: current.y - size,
    size,
    font: current.bold,
    color: rgb(0.05, 0.27, 0.2),
  });
  current.page.drawLine({
    start: { x: MARGIN, y: current.y - size - 4 },
    end: { x: PAGE_WIDTH - MARGIN, y: current.y - size - 4 },
    thickness: style === "modern" ? 1.5 : 0.4,
    color: rgb(0.05, 0.42, 0.32),
  });
  return { ...current, y: current.y - size - 14 };
}

function bullet(cursor: Cursor, title: string, meta: string, body: string): Cursor {
  let current = ensure(cursor, 16);
  const headline = [title, meta].filter(Boolean).join("  ·  ");
  if (headline) {
    current.page.drawText(pdfText(headline, 180), {
      x: MARGIN,
      y: current.y - 11,
      size: 11,
      font: current.bold,
      color: rgb(0.09, 0.13, 0.11),
    });
    current = { ...current, y: current.y - 16 };
  }
  if (body) current = paragraph(current, body, 10.5, 3);
  return { ...current, y: current.y - 6 };
}

export async function buildCvPdf(cv: CvDocument): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursor: Cursor = { page, y: PAGE_HEIGHT - MARGIN, doc, font, bold };
  const name = pdfText(cv.fullName, 120) || "Candidate";
  page.drawText(name, {
    x: MARGIN,
    y: cursor.y - 22,
    size: cv.style === "minimal" ? 18 : 22,
    font: bold,
    color: rgb(0.09, 0.13, 0.11),
  });
  cursor = { ...cursor, y: cursor.y - 30 };
  const contact = [cv.city, cv.phone, cv.email].map((part) => pdfText(part, 160)).filter(Boolean).join("   ·   ");
  if (contact) cursor = paragraph(cursor, contact, 10, 3);
  cursor = { ...cursor, y: cursor.y - 8 };

  const education = cv.education.filter((item) => item.school || item.qualification || item.years);
  const experience = cv.experience.filter((item) => item.company || item.title || item.details);
  const extras = [
    ["Projects", cv.projects],
    ["Certifications", cv.certifications],
    ["Internships", cv.internships],
    ["Achievements", cv.achievements],
  ] as const;

  const drawSummary = () => {
    if (!pdfText(cv.summary, 2000)) return;
    cursor = heading(cursor, "Professional summary", cv.style);
    cursor = paragraph(cursor, cv.summary);
  };
  const drawExperience = () => {
    if (!experience.length) return;
    cursor = heading(cursor, "Experience", cv.style);
    for (const role of experience) {
      cursor = bullet(cursor, [role.title, role.company].filter(Boolean).join(", "), role.duration, role.details);
    }
  };
  const drawEducation = () => {
    if (!education.length) return;
    cursor = heading(cursor, "Education", cv.style);
    for (const item of education) {
      cursor = bullet(cursor, [item.qualification, item.school].filter(Boolean).join(", "), item.years, "");
    }
  };
  const drawSkills = () => {
    const blocks = [
      cv.technicalSkills ? `Technical: ${cv.technicalSkills}` : "",
      cv.professionalSkills ? `Professional: ${cv.professionalSkills}` : "",
      cv.languages ? `Languages: ${cv.languages}` : "",
    ].filter(Boolean);
    if (!blocks.length) return;
    cursor = heading(cursor, "Skills", cv.style);
    cursor = paragraph(cursor, blocks.join("\n"));
  };
  const drawExtras = () => {
    for (const [label, items] of extras) {
      const filled = items.filter((item) => item.title || item.detail);
      if (!filled.length) continue;
      cursor = heading(cursor, label, cv.style);
      for (const item of filled) cursor = bullet(cursor, item.title, "", item.detail);
    }
  };

  const sections: Array<() => void> =
    cv.style === "fresher"
      ? [drawSummary, drawEducation, drawSkills, drawExperience, drawExtras]
      : cv.style === "experienced"
        ? [drawSummary, drawExperience, drawSkills, drawEducation, drawExtras]
        : [drawSummary, drawExperience, drawEducation, drawSkills, drawExtras];
  for (const draw of sections) draw();

  const pages = doc.getPages();
  pages.forEach((item, index) => {
    item.drawText(`${index + 1} / ${pages.length}`, {
      x: PAGE_WIDTH - MARGIN - 36,
      y: 28,
      size: 9,
      font,
      color: rgb(0.37, 0.4, 0.37),
    });
  });
  doc.setTitle(`${name} CV`);
  doc.setAuthor(name);
  doc.setProducer("Brandvika CV builder");
  return doc.save();
}

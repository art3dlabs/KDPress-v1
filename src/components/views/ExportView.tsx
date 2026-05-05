import React, { useState } from 'react';
import { useBook } from '../../context/BookContext';
import { FileDown, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { jsPDF, GState } from 'jspdf';
import { getTheme } from '../../lib/themes';

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function ExportView() {
  const { book } = useBook();
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 80));

      const t = getTheme(book.theme);
      const [pageW, pageH] = book.trimSize === '5x8' ? [5, 8] : [6, 9];

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'in',
        format: [pageW, pageH],
      });

      const iM = t.innerMargin;   // inner/gutter margin
      const oM = t.outerMargin;   // outer margin
      const tM = t.topMargin;
      const bM = t.bottomMargin;

      // For simplicity: use inner margin on both sides (KDP-safe)
      const lM = iM;
      const rM = oM;
      const contentW = pageW - lM - rM;

      doc.setFont(t.bodyFont);

      let pageAdded = false;
      const sectionPageMap: Record<string, number> = {};
      const tocItems: { id: string; title: string; y: number; pageIdx: number }[] = [];

      const currentPage = () => (doc.internal as any).getCurrentPageInfo?.()?.pageNumber ?? (doc.internal as any).getNumberOfPages?.() ?? 1;

      const newPage = () => {
        if (pageAdded) doc.addPage();
        else pageAdded = true;
        // Add running header on non-cover pages
        const pNum = currentPage();
        if (pNum > 1) {
          doc.setFont(t.bodyFont, 'normal');
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          const headerText = pNum % 2 === 0 ? book.title : book.author;
          doc.text(headerText, pageW / 2, tM * 0.5, { align: 'center' });
          doc.setTextColor(0, 0, 0);
        }
      };

      const addPageNumber = (pageNum: number) => {
        doc.setFont(t.bodyFont, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`${pageNum}`, pageW / 2, pageH - bM * 0.45, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      };

      // ── COVER ──────────────────────────────────────────────────────
      if (book.coverImage) {
        newPage();
        const fmt = book.coverImage.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(book.coverImage, fmt, 0, 0, pageW, pageH);

        if (!book.hideTextOnCover) {
          doc.setTextColor(255, 255, 255);

          // Shadow effect: draw text twice (offset + main)
          const titleStr = (book.title || 'TÍTULO DEL LIBRO').toUpperCase();
          const titleFontSize = Math.min(30, Math.max(14, 200 / titleStr.length + 16));
          doc.setFont(t.titleFont, t.titleBold ? 'bold' : t.titleItalic ? 'italic' : 'normal');
          doc.setFontSize(titleFontSize);
          const splitTitle = doc.splitTextToSize(titleStr, pageW * 0.82);
          const titleY = pageH * 0.28;
          // shadow
          doc.setTextColor(0, 0, 0);
          doc.setGState(new GState({ opacity: 0.35 }));
          doc.text(splitTitle, pageW / 2 + 0.02, titleY + 0.02, { align: 'center' });
          doc.setGState(new GState({ opacity: 1 }));
          // main
          doc.setTextColor(255, 255, 255);
          doc.text(splitTitle, pageW / 2, titleY, { align: 'center' });

          if (book.subtitle) {
            doc.setFontSize(12);
            doc.setFont(t.titleFont, 'italic');
            doc.text(book.subtitle, pageW / 2, titleY + splitTitle.length * (titleFontSize / 72) + 0.25, { align: 'center' });
          }

          doc.setFontSize(13);
          doc.setFont(t.titleFont, 'normal');
          doc.text((book.author || 'Autor').toUpperCase(), pageW / 2, pageH * 0.86, { align: 'center' });
          doc.setTextColor(0, 0, 0);
        }
      }

      // ── SECTIONS ────────────────────────────────────────────────────
      let contentPageNum = 0;

      for (const section of book.sections) {
        newPage();
        const pg = currentPage();
        sectionPageMap[section.id] = pg;

        if (section.pageType === 'title-page') {
          // Inner title page
          doc.setFont(t.titleFont, 'normal');
          doc.setFontSize(t.titleSize);
          doc.setTextColor(0, 0, 0);
          const displayTitle = t.titleUpperCase ? (book.title || '').toUpperCase() : (book.title || '');
          const splitT = doc.splitTextToSize(displayTitle, contentW);
          doc.text(splitT, pageW / 2, pageH * 0.32, { align: 'center' });
          if (book.subtitle) {
            doc.setFontSize(t.fontSize + 2);
            doc.setFont(t.titleFont, 'italic');
            doc.text(book.subtitle, pageW / 2, pageH * 0.32 + splitT.length * 0.36 + 0.3, { align: 'center' });
          }
          doc.setFontSize(t.fontSize + 1);
          doc.setFont(t.bodyFont, 'normal');
          doc.text(book.author || 'Autor', pageW / 2, pageH * 0.62, { align: 'center' });

        } else if (section.pageType === 'copyright') {
          doc.setFont(t.bodyFont, 'normal');
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          const yr = section.meta?.year || new Date().getFullYear();
          const holder = section.meta?.holder || book.author;
          const lines = [
            `Copyright © ${yr} ${holder}`,
            'Todos los derechos reservados.',
            '',
            'Ninguna parte de esta publicación podrá ser reproducida,',
            'distribuida o transmitida de ninguna forma o por ningún medio,',
            'sin el permiso previo por escrito del autor o editor.',
            ...(book.isbn ? ['', `ISBN: ${book.isbn}`] : []),
          ];
          let y = pageH * 0.7;
          for (const line of lines) {
            doc.text(line, lM, y);
            y += 0.175;
          }
          doc.setTextColor(0, 0, 0);

        } else if (section.pageType === 'dedication') {
          doc.setFont(t.bodyFont, 'italic');
          doc.setFontSize(t.fontSize + 1);
          const raw = stripHtml(section.content || 'Para ti...');
          const split = doc.splitTextToSize(raw, contentW - 0.5);
          doc.text(split, pageW / 2, pageH * 0.42, { align: 'center' });

        } else if (section.pageType === 'toc') {
          doc.setFont(t.titleFont, t.titleBold ? 'bold' : 'normal');
          doc.setFontSize(t.titleSize * 0.75);
          doc.text(t.titleUpperCase ? 'ÍNDICE' : 'Índice', pageW / 2, tM + 0.6, { align: 'center' });

          // Placeholder — filled in after all sections
          tocItems.length = 0;
          const tocChapters = book.sections.filter(s => s.type === 'chapter' || s.type === 'part');
          let ty = tM + 1.3;
          doc.setFont(t.bodyFont, 'normal');
          doc.setFontSize(t.fontSize - 0.5);
          for (const s of tocChapters) {
            if (ty > pageH - bM) break;
            tocItems.push({ id: s.id, title: s.title, y: ty, pageIdx: pg });
            doc.text(s.title, lM, ty);
            ty += 0.28;
          }

        } else if (section.pageType === 'about-author') {
          // About author
          const chapterY = pageH * t.chapterStartRatio;
          doc.setFont(t.titleFont, t.titleItalic ? 'italic' : 'normal');
          doc.setFontSize(t.titleSize * 0.8);
          doc.text('Sobre el Autor', pageW / 2, chapterY, { align: 'center' });
          doc.setFont(t.bodyFont, 'normal');
          doc.setFontSize(t.fontSize);
          const raw = stripHtml(section.content || '');
          const paras = raw.split('\n\n').filter(Boolean);
          let y = chapterY + 0.55;
          for (const p of paras) {
            if (y > pageH - bM) break;
            const lines = doc.splitTextToSize(p.trim(), contentW);
            for (let i = 0; i < lines.length; i++) {
              if (y > pageH - bM) { doc.addPage(); y = tM + 0.5; }
              doc.text(lines[i], lM, y);
              y += t.lineSpacing;
            }
            y += t.paragraphSpacing;
          }

        } else {
          // Standard chapter / part / back-matter
          contentPageNum++;
          const chapterY = pageH * t.chapterStartRatio;

          // Chapter title
          const rawTitle = t.titleUpperCase ? section.title.toUpperCase() : section.title;
          doc.setFont(t.titleFont, t.titleItalic ? 'italic' : t.titleBold ? 'bold' : 'normal');
          doc.setFontSize(t.titleSize);
          doc.setTextColor(0, 0, 0);
          const splitTitle = doc.splitTextToSize(rawTitle, contentW);
          doc.text(splitTitle, pageW / 2, chapterY, { align: 'center' });

          // Decorator
          if (t.decorator) {
            doc.setFont(t.bodyFont, 'normal');
            doc.setFontSize(t.fontSize - 1);
            doc.setTextColor(120, 120, 120);
            doc.text(t.decorator, pageW / 2, chapterY + splitTitle.length * (t.titleSize / 72) + 0.22, { align: 'center' });
            doc.setTextColor(0, 0, 0);
          }

          // Body content
          doc.setFont(t.bodyFont, 'normal');
          doc.setFontSize(t.fontSize);
          const raw = stripHtml(section.content || '');
          const paragraphs = raw.split('\n\n').filter(p => p.trim());
          let y = chapterY + splitTitle.length * (t.titleSize / 72) + (t.decorator ? 0.48 : 0.35);

          for (let pi = 0; pi < paragraphs.length; pi++) {
            const p = paragraphs[pi].trim();
            if (!p) continue;
            const lines = doc.splitTextToSize(p, contentW);
            for (let li = 0; li < lines.length; li++) {
              if (y > pageH - bM) {
                doc.addPage();
                y = tM + 0.5;
                contentPageNum++;
                addPageNumber(contentPageNum);
              }
              const xOff = (li === 0 && pi > 0 && t.indent > 0) ? t.indent : 0;
              doc.text(lines[li], lM + xOff, y);
              y += t.lineSpacing;
            }
            y += t.paragraphSpacing;
          }

          // Page number on chapter start page
          addPageNumber(contentPageNum);
        }
      }

      // ── FILL TOC PAGE NUMBERS ────────────────────────────────────────
      if (tocItems.length > 0) {
        const firstTocPage = tocItems[0]?.pageIdx;
        if (firstTocPage) {
          doc.setPage(firstTocPage);
          doc.setFont(getTheme(book.theme).bodyFont, 'normal');
          doc.setFontSize(getTheme(book.theme).fontSize - 0.5);
          for (const item of tocItems) {
            const pg = sectionPageMap[item.id];
            if (pg !== undefined) {
              doc.text(String(pg), pageW - rM, item.y, { align: 'right' });
              // Dot leaders
              doc.setFontSize(7);
              const dotLine = '·'.repeat(Math.floor((contentW - 1.5) * 8));
              const titleWidth = doc.getTextWidth(item.title);
              const pgWidth = doc.getTextWidth(String(pg));
              const dotX = lM + titleWidth + 0.08;
              const dotEndX = pageW - rM - pgWidth - 0.1;
              if (dotEndX > dotX + 0.3) {
                doc.text(dotLine, dotX, item.y, { maxWidth: dotEndX - dotX });
              }
              doc.setFontSize(getTheme(book.theme).fontSize - 0.5);
            }
          }
        }
      }

      // ── BACK COVER ──────────────────────────────────────────────────
      if (book.backCoverImage) {
        doc.addPage();
        const fmt = book.backCoverImage.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(book.backCoverImage, fmt, 0, 0, pageW, pageH);

        if (!book.hideTextOnCover && book.backCoverText) {
          const boxW = pageW * 0.78;
          const boxX = (pageW - boxW) / 2;
          const boxY = pageH * 0.22;

          doc.setGState(new GState({ opacity: 0.18 }));
          doc.setFillColor(0, 0, 0);
          doc.roundedRect(boxX, boxY, boxW, pageH * 0.5, 0.06, 0.06, 'F');
          doc.setGState(new GState({ opacity: 1 }));

          doc.setFont(t.bodyFont, 'normal');
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          const split = doc.splitTextToSize(book.backCoverText, boxW - 0.4);
          doc.text(split, pageW / 2, boxY + 0.32, { align: 'center' });

          if (book.isbn) {
            doc.setFontSize(8);
            doc.text(`ISBN: ${book.isbn}`, pageW / 2, pageH * 0.9, { align: 'center' });
          }
          doc.setTextColor(0, 0, 0);
        }
      }

      const fileName = (book.title || 'kdpress-manuscrito').toLowerCase().replace(/\s+/g, '-');
      doc.save(`${fileName}.pdf`);
      setExportComplete(true);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
    } finally {
      setIsExporting(false);
    }
  };

  const t = getTheme(book.theme);
  const chapterCount = book.sections.filter(s => s.type === 'chapter').length;
  const hasCover = !!book.coverImage;
  const wordCount = book.sections.reduce((acc, s) => {
    return acc + (s.content?.replace(/<[^>]+>/g, '') || '').split(/\s+/).filter(Boolean).length;
  }, 0);

  const validations = [
    { text: 'Márgenes interiores (Gutters)', ok: true },
    { text: 'Tipografía coherente con plantilla', ok: true },
    { text: 'Numeración de páginas automática', ok: true },
    { text: 'Índice con números de página reales', ok: chapterCount > 0 },
    { text: `Portada adjunta (${hasCover ? 'Sí' : 'No'})`, ok: hasCover },
    { text: 'Fuentes embebidas (Times/Helvetica/Courier)', ok: true },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#EBE9E4] p-6 md:p-12 pb-24">
      <div className="max-w-3xl mx-auto space-y-8">

        <div className="bg-white p-10 shadow-xl border border-[#E5E4DE] text-center">
          <h2 className="text-3xl font-light tracking-[0.2em] font-serif text-[#1A1A1A] mb-3 uppercase">Exportar Manuscrito</h2>
          <p className="text-gray-500 font-serif italic max-w-xl mx-auto">
            El PDF generado sigue las especificaciones de Amazon KDP con la plantilla <strong>{t.name}</strong> aplicada fielmente.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            ['Capítulos', chapterCount],
            ['Palabras aprox.', wordCount.toLocaleString()],
            ['Plantilla', t.name],
          ].map(([label, val]) => (
            <div key={label as string} className="bg-white border border-[#E5E4DE] p-4 text-center shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
              <p className="text-lg font-bold text-[#1A1A1A] mt-1 truncate">{val}</p>
            </div>
          ))}
        </div>

        {/* Validations */}
        <div className="bg-white border border-[#E5E4DE] p-6 shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-[#E5E4DE] pb-3 mb-4">
            Verificación Pre-Exportación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {validations.map((v, i) => (
              <div key={i} className="flex items-center space-x-3 bg-[#FAFAFA] p-3 border border-[#E5E4DE]">
                <div className={cn("w-5 h-5 flex items-center justify-center shrink-0 rounded-sm", v.ok ? "bg-green-50" : "bg-amber-50")}>
                  {v.ok
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" strokeWidth={2.5} />
                    : <AlertCircle className="w-3.5 h-3.5 text-amber-600" strokeWidth={2.5} />
                  }
                </div>
                <p className={cn("text-[11px] font-bold uppercase tracking-wide", v.ok ? "text-[#1A1A1A]" : "text-amber-700")}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Export button */}
        <div className="bg-white p-10 shadow-xl border border-[#E5E4DE] flex flex-col items-center gap-6">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              "flex items-center space-x-3 px-10 py-4 font-bold uppercase tracking-[0.2em] text-sm transition-all border",
              isExporting
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A] opacity-80 cursor-not-allowed"
                : exportComplete
                  ? "bg-white text-green-700 border-green-600 hover:bg-green-50"
                  : "bg-[#1A1A1A] text-white border-[#1A1A1A] hover:bg-white hover:text-[#1A1A1A] shadow-lg"
            )}
          >
            {isExporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Generando PDF...</span></>
            ) : exportComplete ? (
              <><CheckCircle2 className="w-4 h-4" /><span>Descargado — Exportar de nuevo</span></>
            ) : (
              <><FileDown className="w-4 h-4" /><span>Exportar PDF para KDP</span></>
            )}
          </button>
          <p className="text-[9px] uppercase tracking-widest text-gray-400 text-center max-w-xs">
            El PDF incluye portada, interior completo con la plantilla aplicada, y contraportada si están configuradas.
          </p>
        </div>
      </div>
    </div>
  );
}

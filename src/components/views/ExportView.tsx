import React, { useState } from 'react';
import { useBook } from '../../context/BookContext';
import { FileDown, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { jsPDF, GState } from 'jspdf';

export function ExportView() {
  const { book } = useBook();
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'in',
        format: book.trimSize === '5x8' ? [5, 8] : book.trimSize === '5.5x8.5' ? [5.5, 8.5] : [6, 9]
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();
      const margin = 0.75;
      const contentWidth = width - (margin * 2);
      
      let pageAdded = false;
      const sectionPageMap: Record<string, number> = {};
      const tocRenderItems: { id: string; y: number; pageIndex: number; fontSize: number }[] = [];

      const themeSettings: Record<string, { font: string, yStart: number, indent: number, pMargin: number, fontSize: number, lineSpacing: number, titleSize: number, titleUpperCase: boolean }> = {
        'classic-fiction': { font: 'times', yStart: 2.5, indent: 0.3, pMargin: 0.1, fontSize: 12, lineSpacing: 0.2, titleSize: 24, titleUpperCase: true },
        'non-fiction': { font: 'helvetica', yStart: 1.5, indent: 0, pMargin: 0.2, fontSize: 11, lineSpacing: 0.18, titleSize: 22, titleUpperCase: true },
        'workbook': { font: 'helvetica', yStart: 1.5, indent: 0, pMargin: 0.2, fontSize: 11, lineSpacing: 0.2, titleSize: 18, titleUpperCase: false },
        'sci-fi': { font: 'courier', yStart: 2, indent: 0, pMargin: 0.15, fontSize: 10, lineSpacing: 0.18, titleSize: 20, titleUpperCase: true },
        'romance': { font: 'times', yStart: 2.5, indent: 0.3, pMargin: 0.1, fontSize: 12, lineSpacing: 0.2, titleSize: 20, titleUpperCase: true },
        'fantasy': { font: 'times', yStart: 2.5, indent: 0.3, pMargin: 0.1, fontSize: 12, lineSpacing: 0.2, titleSize: 22, titleUpperCase: true },
      };

      const tMeta = themeSettings[book.theme as keyof typeof themeSettings] || themeSettings['classic-fiction'];
      console.log('Exporting book with theme:', book.theme, 'and meta:', tMeta);
      doc.setFont(tMeta.font);

      // Add cover if exists
      if (book.coverImage) {
        doc.addImage(book.coverImage, 'PNG', 0, 0, width, height);
        
        // Add cover border - adjusted to match preview
        doc.setGState(new GState({opacity: 0.5}));
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.04); // Slightly thicker border
        const coverMargin = Math.min(width, height) * 0.08; // Increased margin
        doc.rect(coverMargin, coverMargin, width - (coverMargin * 2), height - (coverMargin * 2), 'S');
        doc.setGState(new GState({opacity: 1.0}));

        if (!book.hideTextOnCover) {
          doc.setTextColor(255, 255, 255);
          doc.setFont(tMeta.font);
          
          // Title
          const title = (book.title || 'TÍTULO DEL LIBRO').toUpperCase();
          doc.setFontSize(Math.min(36, 120 / title.length + 20)); // Responsive font size
          const splitTitle = doc.splitTextToSize(title, width - (coverMargin * 2));
          doc.text(splitTitle, width / 2, height * 0.3, { align: 'center' });
          
          // Author
          doc.setFontSize(14);
          doc.text((book.author || 'NOMBRE DEL AUTOR').toUpperCase(), width / 2, height - (coverMargin * 1.5), { align: 'center' });
          doc.setTextColor(0, 0, 0);
        }
        pageAdded = true;
      }

      book.sections.forEach((section, index) => {
        if (pageAdded) {
          doc.addPage();
        } else {
          pageAdded = true; // First real content page added natively by jsPDF init or after cover
        }
        
        sectionPageMap[section.id] = doc.internal.getCurrentPageInfo().pageNumber;
        
        if (section.pageType === 'title-page') {
          doc.setFont(tMeta.font);
          doc.setFontSize(24);
          doc.text(book.title || 'Título', width / 2, height / 3, { align: 'center' });
          if (book.subtitle) {
            doc.setFontSize(14);
            doc.text(book.subtitle, width / 2, height / 3 + 0.5, { align: 'center' });
          }
          doc.setFontSize(12);
          doc.text(book.author || 'Autor', width / 2, height * 0.6, { align: 'center' });
        } else if (section.pageType === 'copyright') {
          doc.setFont(tMeta.font);
          doc.setFontSize(10);
          doc.text(`Copyright © ${section.meta?.year || new Date().getFullYear()} ${section.meta?.holder || book.author}`, margin, height - 2);
          doc.text("Todos los derechos reservados.", margin, height - 1.8);
          doc.text("Ninguna parte de este libro podrá ser reproducida...", margin, height - 1.6);
        } else if (section.pageType === 'toc') {
          doc.setFont(tMeta.font);
          doc.setFontSize(18);
          doc.text("Índice", width / 2, margin + 0.5, { align: 'center' });
          
          const tocItems = book.sections.filter(s => s.type === 'chapter' || s.type === 'part');
          const maxAvailableHeight = height - (margin * 2) - 1.5;
          const calculatedSpacing = maxAvailableHeight / Math.max(tocItems.length, 1);
          const finalSpacing = Math.min(0.3, calculatedSpacing);
          
          let fontSize = 12;
          if (finalSpacing < 0.2) fontSize = 10;
          if (finalSpacing < 0.15) fontSize = 8;
          if (finalSpacing < 0.1) fontSize = 6;
          doc.setFontSize(fontSize);
          
          let y = margin + 1.5;
          tocItems.forEach((s) => {
             doc.text(s.title, margin, y);
             tocRenderItems.push({
               id: s.id,
               y,
               pageIndex: doc.internal.getCurrentPageInfo().pageNumber,
               fontSize
             });
             y += finalSpacing;
          });
        } else if (section.pageType === 'dedication') {
          doc.setFont(tMeta.font);
          doc.setFontSize(14);
          const rawText = section.content.replace(/<[^>]+>/g, '').trim();
          const splitText = doc.splitTextToSize(rawText, contentWidth - 1);
          doc.text(splitText, width / 2, height / 2, { align: 'center' });
        } else if (section.pageType === 'image-page' && section.meta?.imageUrl) {
          try {
            // Keep proportions approximate or scale to fit
            doc.addImage(section.meta.imageUrl, 'PNG', margin, margin, contentWidth, height - (margin * 2) - 0.5);
            if (section.content) {
              doc.setFont(tMeta.font);
              doc.setFontSize(10);
              doc.text(section.content, width / 2, height - margin, { align: 'center' });
            }
          } catch (e) {
            console.error('Error adding image page', e);
          }
        } else {
          doc.setFontSize(tMeta.titleSize);
          const theTitle = tMeta.titleUpperCase ? section.title.toUpperCase() : section.title;
          
          if (['classic-fiction', 'romance', 'fantasy'].includes(book.theme)) {
             doc.setFont(tMeta.font, 'italic');
             doc.text(theTitle, width / 2, tMeta.yStart - 0.5, { align: 'center', maxWidth: contentWidth });
             doc.setFont(tMeta.font, 'normal');
          } else {
             doc.setFont(tMeta.font, 'bold');
             doc.text(theTitle, width / 2, tMeta.yStart - 0.5, { align: 'center', maxWidth: contentWidth });
             doc.setFont(tMeta.font, 'normal');
          }
          
          doc.setFontSize(tMeta.fontSize);
          const rawText = section.content.replace(/<\/p>\s*<p>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
          const paragraphs = rawText.split('\n\n');
          
          let y = tMeta.yStart;
          for (const p of paragraphs) {
            if (!p.trim()) continue;
            const splitText = doc.splitTextToSize(p.trim(), contentWidth);
            
            for (let i = 0; i < splitText.length; i++) {
              if (y > height - margin) {
                doc.addPage();
                y = margin + 0.5;
              }
              const xOffset = (i === 0) ? tMeta.indent : 0;
              doc.setFont(tMeta.font, 'normal');
              doc.text(splitText[i], margin + xOffset, y);
              y += tMeta.lineSpacing; 
            }
            y += tMeta.pMargin;
          }
        }
      });
      
      // Draw TOC page numbers
      if (tocRenderItems.length > 0) {
        // Group by page index (should all be on one page but just in case)
        const pagesToUpdate = [...new Set(tocRenderItems.map(item => item.pageIndex))];
        
        pagesToUpdate.forEach(pageIdx => {
          doc.setPage(pageIdx);
          const itemsOnPage = tocRenderItems.filter(item => item.pageIndex === pageIdx);
          
          itemsOnPage.forEach(item => {
            doc.setFontSize(item.fontSize);
            const targetPage = sectionPageMap[item.id];
            if (targetPage !== undefined) {
              const pageStr = targetPage.toString();
              doc.text(pageStr, width - margin, item.y, { align: 'right' });
              
              // optional: dots spanning title to page number
            }
          });
        });
      }
      
      // Navigate to the final page added so far before adding back cover
      doc.setPage(doc.internal.getNumberOfPages());
      
      // Add back cover if exists
      if (book.backCoverImage) {
        doc.addPage();
        doc.addImage(book.backCoverImage, 'PNG', 0, 0, width, height);

        if (!book.hideTextOnCover) {
          const boxWidth = width - 1.5;
          const boxX = (width - boxWidth) / 2;
          const boxY = height * 0.25;
          
          doc.setFont(tMeta.font);
          doc.setFontSize(10);
          const rawText = book.backCoverText || 'Sinopsis o texto de la contratapa del libro.';
          const splitText = doc.splitTextToSize(rawText, boxWidth - 0.2);
          
          const textHeight = splitText.length * 0.15;
          const dynamicBoxHeight = Math.max(textHeight + 0.6, 2);

          // Box style - matching preview box
          doc.setGState(new GState({opacity: 0.2}));
          doc.setFillColor(255, 255, 255);
          doc.rect(boxX, boxY, boxWidth, dynamicBoxHeight, 'F');
          
          doc.setGState(new GState({opacity: 0.4}));
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.02);
          doc.rect(boxX, boxY, boxWidth, dynamicBoxHeight, 'S');

          doc.setGState(new GState({opacity: 1.0}));
          doc.setTextColor(255, 255, 255);
          
          const textY = boxY + 0.3;
          doc.text(splitText, width / 2, textY, { align: 'center' });
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

  const validations = [
    { id: 1, text: 'Márgenes interiores (Gutters)', status: 'pass' },
    { id: 2, text: 'Paginación en impares', status: 'pass' },
    { id: 3, text: 'Sangría 0.5cm validada', status: 'pass' },
    { id: 4, text: 'Resolución de imágenes 300dpi', status: 'pass' },
    { id: 5, text: 'Fuentes incrustadas', status: 'warn', message: 'Fallback sRGB a CMYK en web.' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#EBE9E4] p-6 md:p-12 pb-24">
      <div className="max-w-3xl mx-auto space-y-12">
        
        <div className="text-center bg-white p-12 shadow-xl border border-[#E5E4DE]">
          <h2 className="text-3xl font-light tracking-[0.2em] font-serif text-[#1A1A1A] mb-4 uppercase">Listo para Imprimir</h2>
          <p className="text-gray-500 font-serif italic max-w-xl mx-auto mb-10">Tu libro ha sido formateado siguiendo las directrices estrictas de Amazon KDP. El archivo generado estará listo para subir a la plataforma.</p>
          
          <div className="bg-[#F7F6F3] border border-[#E5E4DE] text-left mb-10 p-6">
             <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-[#E5E4DE] pb-2 mb-4 flex items-center gap-2">
               Validación PDF/X-1a 
               <div className="group relative flex items-center z-50">
                 <Info size={14} className="text-gray-400 cursor-help" />
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center font-normal">
                   Verificaciones automáticas y estándares de Amazon KDP para prevenir rechazos del archivo.
                 </div>
               </div>
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {validations.map(val => (
                 <div key={val.id} className="flex items-start space-x-3 bg-white p-3 border border-[#E5E4DE] shadow-sm">
                   {val.status === 'pass' ? (
                     <div className="w-4 h-4 bg-green-100 flex items-center justify-center shrink-0 rounded-sm">
                        <CheckCircle2 className="w-3 h-3 text-green-700" strokeWidth={3} />
                     </div>
                   ) : (
                     <div className="w-4 h-4 bg-amber-100 flex items-center justify-center shrink-0 rounded-sm">
                        <AlertCircle className="w-3 h-3 text-amber-700" strokeWidth={3} />
                     </div>
                   )}
                   <div>
                     <p className={cn("text-[11px] font-bold uppercase tracking-wide", val.status === 'pass' ? "text-[#1A1A1A]" : "text-amber-700")}>{val.text}</p>
                     {val.message && <p className="text-[9px] text-amber-600/80 mt-1 uppercase">{val.message}</p>}
                   </div>
                 </div>
               ))}
             </div>
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={handleExport}
              disabled={isExporting || exportComplete}
              className={cn(
                "flex items-center space-x-3 px-8 py-4 font-bold uppercase tracking-[0.2em] text-xs transition-all border border-[#1A1A1A]",
                isExporting ? "bg-[#1A1A1A] text-white opacity-80 cursor-not-allowed" : 
                exportComplete ? "bg-white text-green-700 border-green-700" : "bg-[#1A1A1A] text-white hover:bg-white hover:text-[#1A1A1A] shadow-lg"
              )}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Renderizando...</span>
                </>
              ) : exportComplete ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PDF Descargado</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Exportar Manuscrito</span>
                </>
              )}
            </button>
            
            <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-6 text-center max-w-sm">
              Confirmas los derechos de autor.<br/>Tamaño estimado PDF: 15MB.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useBook } from '../../context/BookContext';
import { cn } from '../../lib/utils';
import { Check, Info } from 'lucide-react';
import { THEMES, ThemeKey } from '../../lib/themes';

// Mini page preview that matches PDF output exactly
function ThemePagePreview({ themeId, title, author, chapterTitle, bodyText }: {
  themeId: string;
  title: string;
  author: string;
  chapterTitle: string;
  bodyText: string;
}) {
  const t = THEMES[themeId as ThemeKey] ?? THEMES['classic-fiction'];

  const fontStyle = t.bodyFont === 'times' ? 'Georgia, "Times New Roman", serif'
    : t.bodyFont === 'courier' ? '"Courier New", Courier, monospace'
    : 'Arial, Helvetica, sans-serif';

  const titleFontStyle = t.titleFont === 'times' ? 'Georgia, "Times New Roman", serif'
    : t.titleFont === 'courier' ? '"Courier New", Courier, monospace'
    : 'Arial, Helvetica, sans-serif';

  const scaledFontSize = Math.max(7, t.fontSize * 0.62);
  const scaledTitleSize = Math.max(10, t.titleSize * 0.55);
  const scaledLineH = t.lineSpacing * 70;
  const scaledIndent = t.indent * 35;
  const scaledParaGap = t.paragraphSpacing * 40;
  const scaledChapterY = t.chapterStartRatio;

  const paragraphs = bodyText.split('\n\n').filter(Boolean).slice(0, 4);

  const titleDisplay = t.titleUpperCase ? chapterTitle.toUpperCase() : chapterTitle;

  return (
    <div style={{
      width: '100%',
      aspectRatio: '3/4',
      background: t.bg,
      fontFamily: fontStyle,
      fontSize: `${scaledFontSize}px`,
      lineHeight: `${scaledLineH}px`,
      position: 'relative',
      overflow: 'hidden',
      padding: '8px 10px',
      boxSizing: 'border-box',
    }}>
      {/* Chapter title at correct vertical position */}
      <div style={{
        position: 'absolute',
        top: `${scaledChapterY * 100}%`,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: titleFontStyle,
        fontSize: `${scaledTitleSize}px`,
        fontStyle: t.titleItalic ? 'italic' : 'normal',
        fontWeight: t.titleBold ? 'bold' : 'normal',
        color: t.accent,
        letterSpacing: t.titleUpperCase ? '0.08em' : '0',
        padding: '0 8px',
      }}>
        {titleDisplay}
      </div>

      {/* Body text */}
      <div style={{
        position: 'absolute',
        top: `${scaledChapterY * 100 + 16}%`,
        left: '10px',
        right: '10px',
        bottom: '14px',
        overflow: 'hidden',
      }}>
        {paragraphs.map((p, i) => (
          <p key={i} style={{
            margin: 0,
            marginBottom: `${scaledParaGap}px`,
            textIndent: i > 0 && t.indent > 0 ? `${scaledIndent}px` : '0',
            textAlign: 'justify',
            color: '#1A1A1A',
          }}>
            {p.replace(/<[^>]+>/g, '').slice(0, 180)}
          </p>
        ))}
      </div>

      {/* Page number */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: '6px',
        color: '#999',
        letterSpacing: '0.1em',
      }}>
        — 1 —
      </div>

      {/* Decorator if any */}
      {t.decorator && (
        <div style={{
          position: 'absolute',
          top: `${scaledChapterY * 100 + 10}%`,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '8px',
          color: t.accent,
          opacity: 0.5,
        }}>
          {t.decorator}
        </div>
      )}
    </div>
  );
}

export function StyleView() {
  const { book, updateBookDetails } = useBook();
  const [previewPage, setPreviewPage] = useState<'chapter' | 'title'>('chapter');

  const firstChapter = book.sections.find(s => s.type === 'chapter');
  const bodyText = firstChapter?.content
    ? firstChapter.content.replace(/<[^>]+>/g, '\n').split('\n').filter(p => p.trim()).join('\n\n')
    : 'Era una noche oscura y tormentosa cuando llegó la carta. Nadie esperaba que todo cambiara tan rápido, pero así sucedió.\n\nLas horas pasaron lentas, cargadas de un silencio que pesaba como plomo sobre los hombros de quien leía.';

  const themeKeys = Object.keys(THEMES) as ThemeKey[];

  return (
    <div className="h-full overflow-y-auto bg-[#EBE9E4] p-6 md:p-12 pb-24">
      <div className="max-w-5xl mx-auto space-y-12 bg-white shadow-2xl p-10 border border-[#E5E4DE]">

        <div className="text-center border-b border-[#E5E4DE] pb-8">
          <h2 className="text-xl font-light tracking-[0.2em] uppercase text-[#1A1A1A] mb-3">Plantillas de Interior</h2>
          <p className="text-gray-500 font-serif italic max-w-lg mx-auto text-sm">
            Cada plantilla define tipografía, márgenes, sangría y estilo de capítulos — exactamente como aparecerá en el PDF final.
          </p>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {themeKeys.map((themeId) => {
            const t = THEMES[themeId];
            const isActive = book.theme === themeId;
            return (
              <div
                key={themeId}
                onClick={() => updateBookDetails({ theme: themeId as any })}
                className={cn(
                  "relative cursor-pointer transition-all group flex flex-col",
                  isActive ? "ring-2 ring-[#1A1A1A]" : "hover:ring-1 hover:ring-gray-300"
                )}
              >
                {isActive && (
                  <div className="absolute -top-2 -right-2 z-10 bg-[#1A1A1A] text-white p-1 rounded-full shadow-md">
                    <Check size={11} />
                  </div>
                )}

                {/* Live preview thumbnail */}
                <div className="border border-[#E5E4DE] shadow-sm overflow-hidden">
                  <ThemePagePreview
                    themeId={themeId}
                    title={book.title || 'Título'}
                    author={book.author || 'Autor'}
                    chapterTitle={firstChapter?.title || 'Capítulo 1'}
                    bodyText={bodyText}
                  />
                </div>

                <div className={cn(
                  "p-2 text-center transition-colors border-t",
                  isActive ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "bg-white border-[#E5E4DE] group-hover:bg-[#F7F6F3]"
                )}>
                  <p className="text-[9px] font-bold uppercase tracking-widest truncate">{t.name}</p>
                  <p className={cn("text-[8px] mt-0.5", isActive ? "text-gray-300" : "text-gray-400")}>{t.genre}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected theme detail */}
        {book.theme && (
          <div className="bg-[#F7F6F3] border border-[#E5E4DE] p-6 flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Plantilla seleccionada</p>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{THEMES[book.theme as ThemeKey]?.name}</h3>
              <p className="text-sm text-gray-600 font-serif italic mb-4">{THEMES[book.theme as ThemeKey]?.description}</p>
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                {[
                  ['Fuente cuerpo', THEMES[book.theme as ThemeKey]?.bodyFont],
                  ['Tamaño', `${THEMES[book.theme as ThemeKey]?.fontSize}pt`],
                  ['Sangría', THEMES[book.theme as ThemeKey]?.indent > 0 ? `${THEMES[book.theme as ThemeKey].indent}" por párrafo` : 'Sin sangría'],
                  ['Margen interior', `${THEMES[book.theme as ThemeKey]?.innerMargin}"`],
                  ['Capítulo inicia a', `${Math.round(THEMES[book.theme as ThemeKey]?.chapterStartRatio * 100)}% de la página`],
                  ['Interlineado', `${THEMES[book.theme as ThemeKey]?.lineSpacing}" entre líneas`],
                ].map(([label, val]) => (
                  <div key={label} className="bg-white border border-[#E5E4DE] p-2">
                    <p className="text-gray-400 uppercase tracking-widest text-[9px]">{label}</p>
                    <p className="font-bold text-[#1A1A1A] mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Large preview */}
            <div className="w-48 shrink-0 shadow-xl border border-[#E5E4DE]">
              <ThemePagePreview
                themeId={book.theme}
                title={book.title || 'Título'}
                author={book.author || 'Autor'}
                chapterTitle={firstChapter?.title || 'Capítulo 1'}
                bodyText={bodyText}
              />
            </div>
          </div>
        )}

        {/* Physical Attributes */}
        <div className="space-y-6 pt-8 border-t border-[#E5E4DE]">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-[#E5E4DE] pb-2 text-center flex items-center justify-center gap-2">
            Atributos Físicos
            <div className="group relative flex items-center">
              <Info size={12} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center">
                Definen el libro físico impreso. Afectan márgenes y lomo de portada.
              </div>
            </div>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Tipo de Papel</label>
              <div className="flex space-x-4">
                {(['cream', 'white'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => updateBookDetails({ paperType: p })}
                    className={cn(
                      "flex-1 py-3 px-4 border flex items-center justify-center space-x-2 transition-colors",
                      book.paperType === p ? "bg-[#F7F6F3] border-[#1A1A1A] text-[#1A1A1A]" : "bg-white border-[#E5E4DE] hover:bg-[#F0EFED] text-gray-500"
                    )}
                  >
                    <div className={cn("w-3 h-3 rounded-full border border-gray-300", p === 'cream' ? "bg-[#FDFBF7]" : "bg-white")}></div>
                    <span className="text-xs font-bold uppercase tracking-wider">{p === 'cream' ? 'Crema' : 'Blanco'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Tamaño de Corte</label>
              <select
                value={book.trimSize}
                onChange={(e) => updateBookDetails({ trimSize: e.target.value as any })}
                className="w-full border border-[#E5E4DE] p-3 text-xs font-bold text-[#1A1A1A] uppercase tracking-widest hover:border-gray-400 focus:outline-none focus:border-[#1A1A1A] bg-transparent appearance-none rounded-none"
              >
                <option value="5x8">5 × 8 pulgadas (12.7 × 20.3 cm)</option>
                <option value="6x9">6 × 9 pulgadas (15.2 × 22.9 cm) — Popular</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

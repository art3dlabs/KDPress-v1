import React, { useState } from 'react';
import { X, FileText, Sparkles, Loader2, CheckCircle2, Info } from 'lucide-react';
import { useBook } from '../../context/BookContext';
import { SectionType } from '../../types';
import { cn } from '../../lib/utils';

export function ImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [text, setText] = useState('');
  const [replace, setReplace] = useState(true);
  const [includeExtras, setIncludeExtras] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [done, setDone] = useState(false);
  const { importSections } = useBook();

  if (!isOpen) return null;

  // Regex-based fallback parser (no AI)
  const parseManual = (raw: string) => {
    const lines = raw.split('\n');
    const sections: any[] = [];

    if (includeExtras && replace) {
      sections.push(
        { title: 'Portada Interior', type: 'front-matter', pageType: 'title-page', content: '' },
        { title: 'Derechos de Autor', type: 'front-matter', pageType: 'copyright', content: '', meta: { year: new Date().getFullYear().toString(), holder: 'Autor' } },
        { title: 'Dedicatoria', type: 'front-matter', pageType: 'dedication', content: 'Para ti...' },
        { title: 'Índice', type: 'front-matter', pageType: 'toc', content: '' },
        { title: 'Prólogo', type: 'front-matter', pageType: 'standard', content: '' },
      );
    }

    let currentTitle = '';
    let currentType: SectionType = 'chapter';
    let currentLines: string[] = [];

    const save = () => {
      if (!currentTitle && currentLines.length === 0) return;
      const content = currentLines.filter(l => l.trim()).join('\n\n');
      sections.push({ title: currentTitle || 'Sección', type: currentType, pageType: 'standard', content });
      currentLines = [];
    };

    for (const line of lines) {
      const up = line.trim().toUpperCase();
      if (up.startsWith('PARTE ') || up.startsWith('PART ')) {
        save(); currentTitle = line.trim(); currentType = 'part';
      } else if (up.startsWith('CAPÍTULO ') || up.startsWith('CAPITULO ') || up.startsWith('CHAPTER ')) {
        save(); currentTitle = line.trim(); currentType = 'chapter';
      } else if (/^(EPÍLOGO|EPILOGO|EPÍLOG|EPILOG|CONCLUSIÓN|CONCLUSION|FINAL|FIN)$/i.test(line.trim())) {
        save(); currentTitle = line.trim(); currentType = 'back-matter';
      } else if (line.trim() !== '') {
        if (!currentTitle) { currentTitle = line.trim(); }
        else currentLines.push(line.trim());
      }
    }
    save();
    return sections;
  };

  // AI-powered parser using Anthropic API
  const parseWithAI = async (raw: string) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analiza el siguiente texto de un manuscrito y devuelve SOLO un JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
{
  "sections": [
    {
      "title": "Título de la sección",
      "type": "chapter" | "part" | "front-matter" | "back-matter",
      "pageType": "standard" | "title-page" | "copyright" | "dedication" | "toc",
      "content": "Contenido completo de esta sección"
    }
  ]
}

Reglas:
- Detecta automáticamente capítulos, partes, prólogos, epílogos
- Preserva TODO el texto original, sin resúmenes
- Si hay contenido previo a cualquier capítulo, ponlo en front-matter con pageType "standard"
- Máximo 40 secciones

TEXTO A ANALIZAR (primeros 8000 chars):
${raw.slice(0, 8000)}`
        }]
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const text = data.content?.map((c: any) => c.text || '').join('') || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed.sections as any[];
  };

  const handleImport = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setDone(false);
    try {
      let sections: any[];
      if (useAI) {
        try {
          sections = await parseWithAI(text);
        } catch (e) {
          console.warn('AI parse failed, falling back to manual', e);
          sections = parseManual(text);
        }
      } else {
        sections = parseManual(text);
      }

      // Add front matter if requested and AI didn't include them
      if (includeExtras && replace) {
        const hasTitlePage = sections.some(s => s.pageType === 'title-page');
        if (!hasTitlePage) {
          sections.unshift(
            { title: 'Portada Interior', type: 'front-matter', pageType: 'title-page', content: '' },
            { title: 'Derechos de Autor', type: 'front-matter', pageType: 'copyright', content: '', meta: { year: new Date().getFullYear().toString(), holder: 'Autor' } },
            { title: 'Dedicatoria', type: 'front-matter', pageType: 'dedication', content: '' },
            { title: 'Índice', type: 'front-matter', pageType: 'toc', content: '' },
          );
        }
      }

      importSections(sections, replace);
      setDone(true);
      setTimeout(() => { onClose(); setDone(false); }, 1200);
    } catch (e) {
      console.error(e);
      alert('Error al procesar el texto. Intenta con el modo manual.');
    } finally {
      setIsProcessing(false);
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl shadow-2xl border border-[#E5E4DE] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DE]">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A]">Importar Manuscrito</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Pega tu texto — se detectarán capítulos automáticamente</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F0EFED] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Options */}
        <div className="px-6 py-3 border-b border-[#E5E4DE] bg-[#FAFAFA] flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#1A1A1A]" />
            <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={11} className="text-amber-500" />
              Procesado con IA
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#1A1A1A]" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Reemplazar secciones existentes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={includeExtras} onChange={e => setIncludeExtras(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#1A1A1A]" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Agregar páginas legales</span>
          </label>
        </div>

        {/* Textarea */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Pega aquí tu manuscrito completo
            </label>
            {wordCount > 0 && (
              <span className="text-[10px] text-gray-400">{wordCount.toLocaleString()} palabras</span>
            )}
          </div>
          <textarea
            className="flex-1 min-h-[280px] border border-[#E5E4DE] bg-[#FDFDFB] p-4 text-sm font-mono text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] resize-none"
            placeholder={`CAPÍTULO 1\nEl comienzo de todo\n\nEra una mañana gris cuando...\n\nCAPÍTULO 2\nLa revelación\n\nNadie esperaba que...`}
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E4DE] flex items-center justify-between gap-4">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">
            {useAI ? 'La IA detectará estructura, títulos y secciones automáticamente.' : 'Modo manual: detecta "CAPÍTULO N" y "PARTE N".'}
          </p>
          <button
            onClick={handleImport}
            disabled={!text.trim() || isProcessing || done}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors border",
              done
                ? "bg-green-700 text-white border-green-700"
                : isProcessing
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A] opacity-70 cursor-not-allowed"
                  : !text.trim()
                    ? "bg-gray-100 text-gray-400 border-[#E5E4DE] cursor-not-allowed"
                    : "bg-[#1A1A1A] text-white border-[#1A1A1A] hover:bg-white hover:text-[#1A1A1A]"
            )}
          >
            {done ? (
              <><CheckCircle2 size={13} /><span>¡Importado!</span></>
            ) : isProcessing ? (
              <><Loader2 size={13} className="animate-spin" /><span>{useAI ? 'Analizando con IA...' : 'Procesando...'}</span></>
            ) : (
              <><FileText size={13} /><span>Importar</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

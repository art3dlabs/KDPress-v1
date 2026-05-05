import React, { useState } from 'react';
import { X, FileText, CheckCircle2, Info } from 'lucide-react';
import { useBook } from '../../context/BookContext';
import { SectionType } from '../../types';

export function ImportModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [text, setText] = useState('');
  const [replace, setReplace] = useState(false);
  const [includeExtras, setIncludeExtras] = useState(true);
  const { importSections } = useBook();

  if (!isOpen) return null;

  const handleImport = () => {
    if (!text.trim() && !includeExtras) return;

    const lines = text.split('\n');
    const importedSections: any[] = [];
    
    if (replace && includeExtras) {
      importedSections.push(
        { title: 'Portada Interior', type: 'front-matter', pageType: 'title-page', content: '' },
        { title: 'Derechos de Autor (Copyright)', type: 'front-matter', pageType: 'copyright', content: '', meta: { year: new Date().getFullYear().toString(), holder: 'Autor' } },
        { title: 'Dedicatoria', type: 'front-matter', pageType: 'dedication', content: 'Para ti...' },
        { title: 'Índice o Contenido', type: 'front-matter', pageType: 'toc', content: '' },
        { title: 'Prólogo o Introducción', type: 'front-matter', pageType: 'standard', content: 'Comienza aquí tu prólogo...' }
      );
    }

    let currentTitle = lines.length > 0 && text.trim() ? 'Texto Inicial' : '';
    let currentType: SectionType = 'front-matter';
    let currentLines: string[] = [];

    const saveCurrent = () => {
      if (currentLines.length > 0 || currentTitle) {
        const content = currentLines.filter(l => l.trim() !== '').join('\n\n');
        importedSections.push({
          title: currentTitle || 'Sección',
          type: currentType,
          pageType: 'standard',
          content: content || ''
        });
      }
      currentLines = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const upperLine = line.toUpperCase();
      
      // Detect parts
      if (upperLine.startsWith('PARTE ')) {
        if (currentTitle) saveCurrent();
        currentTitle = line;
        currentType = 'part';
        continue;
      } 
      
      // Detect chapters
      if (upperLine.startsWith('CAPÍTULO ') || upperLine.startsWith('CAPITULO ')) {
        if (currentTitle) saveCurrent();
        currentTitle = line;
        currentType = 'chapter';
        
        // Optional: Check if next line is a subtitle/chapter name and include it
        if (i + 1 < lines.length && lines[i+1].trim() && !lines[i+1].toUpperCase().startsWith('CAP')) {
          currentLines.push(lines[i+1].trim());
          i++; // Skip next line since we used it
        }
        continue;
      }
      
      if (line) {
        currentLines.push(line);
      }
    }
    
    if (currentLines.length > 0) saveCurrent();
    
    if (replace && includeExtras) {
      importedSections.push(
        { title: 'Epílogo', type: 'back-matter', pageType: 'standard', content: 'Conclusión o nota final...' },
        { title: 'Acerca del Autor', type: 'back-matter', pageType: 'about-author', content: 'Biografía del autor...' },
        { title: 'Agradecimientos extras', type: 'back-matter', pageType: 'standard', content: 'Agradecimientos...' }
      );
    }

    if (importedSections.length > 0) {
      importSections(importedSections, replace);
    }
    
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/80 p-4 backdrop-blur-sm">
      <div className="bg-[#F7F6F3] w-full max-w-3xl flex flex-col shadow-2xl border border-[#E5E4DE] max-h-[85vh]">
        <div className="p-6 border-b border-[#E5E4DE] flex justify-between items-center bg-white">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2">Importar Manuscrito <Info size={16} className="text-gray-400" title="Copia y pega todo el texto de tu documento. Generaremos la estructura base por ti." /></h2>
            <p className="text-[10px] uppercase text-gray-500 tracking-wider mt-1">Pega todo tu libro. El sistema detectará "Parte X" y "Capítulo X" automáticamente.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F0EFED] transition-colors rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1 flex flex-col min-h-0 bg-white">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ejemplo:&#10;&#10;PARTE I: EL ECO EN LA MÁQUINA&#10;&#10;CAPÍTULO 1&#10;La Anomalía&#10;&#10;Había pasado mucho tiempo desde que..."
            className="flex-1 w-full p-4 border border-[#E5E4DE] bg-[#FDFDFB] text-sm resize-none focus:outline-none focus:border-[#1A1A1A] font-serif"
          />
        </div>
        
        <div className="p-6 border-t border-[#E5E4DE] bg-[#F0EFED] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <label className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] cursor-pointer">
              <input 
                type="checkbox" 
                checked={replace} 
                onChange={(e) => setReplace(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A1A]"
              />
              <span>Reemplazar estructura actual</span>
            </label>
            <label className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] cursor-pointer" title="Se agregarán páginas estándar como Copyright, Dedicatoria, Índice, Prólogo y Epílogo al importar.">
              <input 
                type="checkbox" 
                checked={includeExtras} 
                onChange={(e) => setIncludeExtras(e.target.checked)}
                disabled={!replace}
                className="w-4 h-4 accent-[#1A1A1A] disabled:opacity-50"
              />
              <span className={!replace ? 'opacity-50' : ''}>Añadir páginas preliminares y finales automáticas</span>
            </label>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 font-bold uppercase tracking-widest text-[10px] text-gray-500 hover:text-[#1A1A1A]"
            >
              Cancelar
            </button>
            <button 
              onClick={handleImport}
              className="px-6 py-3 bg-[#1A1A1A] text-white font-bold uppercase tracking-[0.2em] text-xs hover:bg-black flex items-center space-x-2"
            >
              <span>Procesar Libro</span>
              <FileText size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useBook } from '../../context/BookContext';
import { Info, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export function SettingsView() {
  const { book, updateBookDetails } = useBook();
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      // Find first 3 chapters
      const chapters = book.sections.filter(s => s.type === 'chapter').slice(0, 3);
      if (chapters.length === 0) {
        alert("No hay capítulos en tu libro para resumir.");
        setIsGeneratingSummary(false);
        return;
      }
      
      const combinedText = chapters.map(c => `Capítulo: ${c.title}\n${c.content.replace(/<[^>]+>/g, '')}`).join('\n\n');
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Eres un experto publicista de libros. A partir del siguiente texto de los primeros capítulos, escribe un resumen atrapante y profesional para la contratapa de un libro. No uses frases como "Este libro trata sobre..." sino ve directo a la intriga. Máximo 150 palabras.\n\n${combinedText}`
      });

      if (response.text) {
        updateBookDetails({ backCoverText: response.text });
      }
    } catch (e) {
      console.error(e);
      alert('Error al generar el resumen con Inteligencia Artificial.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#EBE9E4] p-6 md:p-12 pb-24">
      <div className="max-w-2xl mx-auto space-y-12 bg-white shadow-xl p-10 border border-[#E5E4DE]">
        <div className="text-center border-b border-[#E5E4DE] pb-6">
          <h2 className="text-xl font-light tracking-[0.2em] font-serif text-[#1A1A1A] mb-2 uppercase">Ajustes del Libro</h2>
          <p className="text-gray-500 font-serif italic text-sm">Configura los metadatos globales de tu obra documental.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2 flex items-center gap-2">
              Título de la Obra 
              <div className="group relative flex items-center z-50">
                <Info size={12} className="text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center font-normal">
                  Éste será el título principal usado en el interior, cabeceras y portapapeles.
                </div>
              </div>
            </label>
            <input 
              type="text" 
              value={book.title} 
              onChange={(e) => updateBookDetails({ title: e.target.value })}
              className="w-full border-b border-[#E5E4DE] bg-transparent p-3 focus:outline-none focus:border-[#1A1A1A] text-[#1A1A1A] text-lg font-serif transition-colors" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2 flex items-center gap-2">
              Subtítulo <span className="text-gray-400 font-normal">Opcional</span> 
              <div className="group relative flex items-center z-40">
                <Info size={12} className="text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center font-normal">
                  Si tu libro tiene un subtítulo, ingrésalo aquí.
                </div>
              </div>
            </label>
            <input 
              type="text" 
              value={book.subtitle || ''} 
              onChange={(e) => updateBookDetails({ subtitle: e.target.value })}
              className="w-full border border-[#E5E4DE] bg-white p-3 focus:outline-none focus:border-[#1A1A1A] text-[#1A1A1A] text-sm transition-colors" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2 flex items-center gap-2">
              Nombre del Autor 
              <div className="group relative flex items-center z-30">
                <Info size={12} className="text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center font-normal">
                  El nombre del creador principal de la obra.
                </div>
              </div>
            </label>
            <input 
              type="text" 
              value={book.author} 
              onChange={(e) => updateBookDetails({ author: e.target.value })}
              className="w-full border border-[#E5E4DE] bg-white p-3 focus:outline-none focus:border-[#1A1A1A] text-[#1A1A1A] text-sm transition-colors uppercase tracking-wider" 
            />
          </div>

          <div className="pt-6 border-t border-[#E5E4DE]">
            <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                Texto de Contratapa
                <div className="group relative flex items-center z-20">
                  <Info size={12} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center font-normal">
                    Este texto se utilizará para la contratapa de tu libro. Puedes redactarlo tú mismo o pedirle a la Inteligencia Artificial que lo genere.
                  </div>
                </div>
              </span>
              <button 
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="flex items-center gap-1.5 bg-[#F0EFED] hover:bg-[#E5E4DE] text-[#1A1A1A] px-3 py-1.5 rounded-none text-[10px] uppercase font-bold transition-colors disabled:opacity-50"
              >
                {isGeneratingSummary ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {isGeneratingSummary ? 'Resumiendo...' : 'Generar con IA (Resumir 3 caps)'}
              </button>
            </label>
            <textarea 
              value={book.backCoverText || ''} 
              onChange={(e) => updateBookDetails({ backCoverText: e.target.value })}
              className="w-full h-32 border border-[#E5E4DE] bg-white p-3 focus:outline-none focus:border-[#1A1A1A] text-[#1A1A1A] text-sm transition-colors resize-y leading-relaxed font-serif" 
              placeholder="En un mundo donde..."
            />
          </div>

          <div className="pt-6 border-t border-[#E5E4DE]">
            <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2 flex items-center gap-2">
              ISBN <span className="text-gray-400 font-normal">Opcional</span> 
              <div className="group relative flex items-center z-20">
                <Info size={12} className="text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center font-normal">
                  Código de barras e identificador único de distribución. En KDP puedes dejarlo en blanco.
                </div>
              </div>
            </label>
            <div className="flex">
               <div className="bg-[#1A1A1A] text-white px-4 py-3 font-mono text-xs font-bold border border-[#1A1A1A]">ISBN</div>
               <input 
                 type="text" 
                 value={book.isbn || ''} 
                 onChange={(e) => updateBookDetails({ isbn: e.target.value })}
                 placeholder="978-3-16-148410-0"
                 className="flex-1 border border-l-0 border-[#E5E4DE] bg-[#FDFDFB] p-3 focus:outline-none focus:border-[#1A1A1A] text-[#1A1A1A] font-mono text-sm tracking-widest" 
               />
            </div>
            <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wide">KDP te proporciona uno gratuito si se deja en blanco.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

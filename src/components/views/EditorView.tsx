import React, { useState, useRef } from 'react';
import { useBook } from '../../context/BookContext';
import { Section } from '../../types';
import { Plus, Trash2, Info, UploadCloud, Sparkles, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { RichTextEditor } from '../ui/RichTextEditor';
import { ImportModal } from './ImportModal';

const PAGE_TYPE_LABELS: Record<string, string> = {
  'title-page': 'Portada Interior',
  'copyright': 'Derechos',
  'dedication': 'Dedicatoria',
  'toc': 'Índice',
  'standard': '',
  'about-author': 'Sobre el Autor',
  'image-page': 'Página de Imagen',
};

const SECTION_TYPE_COLORS: Record<string, string> = {
  'front-matter': 'text-blue-400',
  'chapter': 'text-gray-400',
  'part': 'text-amber-500',
  'back-matter': 'text-purple-400',
};

export function EditorView() {
  const { book, updateBookDetails, addSection, updateSection, deleteSection, reorderSections } = useBook();
  const [activeSectionId, setActiveSectionId] = useState<string | null>(book.sections[0]?.id || null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const activeSection = book.sections.find(s => s.id === activeSectionId);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) reorderSections(index, index - 1);
    if (direction === 'down' && index < book.sections.length - 1) reorderSections(index, index + 1);
  };

  const handleSectionContentChange = (content: string) => {
    if (activeSectionId) {
      updateSection(activeSectionId, { content });
    }
  };

  // AI: generate chapter content suggestion
  const handleGenerateAI = async () => {
    if (!activeSection) return;
    setIsGeneratingAI(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Eres un asistente de escritura creativa. El libro se llama "${book.title}" de ${book.author}.

El capítulo actual se llama: "${activeSection.title}"

${activeSection.content ? `Contenido existente:\n${activeSection.content.replace(/<[^>]+>/g, '')}\n\nContinúa el texto de forma coherente y atractiva.` : 'No hay contenido aún. Escribe el inicio de este capítulo (máximo 3 párrafos, sin títulos, solo el cuerpo narrativo).'}

Responde SOLO con el texto narrativo en HTML simple (usa <p> para párrafos). Sin explicaciones.`
          }]
        })
      });
      const data = await response.json();
      const newText = data.content?.map((c: any) => c.text || '').join('') || '';
      const clean = newText.replace(/```html?\n?/g, '').replace(/```\n?/g, '').trim();
      const appended = (activeSection.content || '') + (activeSection.content ? '\n' : '') + clean;
      updateSection(activeSectionId!, { content: appended });
    } catch (e) {
      alert('Error al conectar con la IA.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col md:flex-row pb-0">
        {/* Left Pane: Structure */}
        <div className="w-full md:w-60 bg-[#FDFDFB] border-r border-[#E5E4DE] flex flex-col h-full shrink-0">

          {/* Book title/author */}
          <div className="p-4 border-b border-[#E5E4DE] bg-white">
            <input
              className="w-full font-serif text-base font-bold placeholder-gray-300 border-none outline-none focus:ring-0 px-0 bg-transparent mb-1 text-[#1A1A1A]"
              placeholder="Título del Libro..."
              value={book.title}
              onChange={(e) => updateBookDetails({ title: e.target.value })}
            />
            <input
              className="w-full font-sans text-[10px] uppercase tracking-widest placeholder-gray-400 border-none outline-none focus:ring-0 px-0 bg-transparent text-gray-500"
              placeholder="Autor..."
              value={book.author}
              onChange={(e) => updateBookDetails({ author: e.target.value })}
            />
          </div>

          {/* Structure header */}
          <div className="px-4 py-2.5 border-b border-[#E5E4DE] flex justify-between items-center bg-[#F0EFED]">
            <h2 className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">
              Estructura · {book.sections.length}
            </h2>
            <button onClick={() => addSection('chapter')} title="Añadir Capítulo"
              className="text-gray-500 hover:text-[#1A1A1A] bg-white p-1 shadow-sm border border-[#E5E4DE]">
              <Plus size={13} />
            </button>
          </div>

          {/* Sections list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <AnimatePresence>
              {book.sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "group flex items-center justify-between p-2 text-xs border cursor-pointer transition-colors",
                    activeSectionId === section.id
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "bg-white border-[#E5E4DE] text-[#1A1A1A] hover:border-gray-400",
                    section.type === 'chapter' && book.sections.some(s => s.type === 'part') ? "ml-3" : ""
                  )}
                  onClick={() => setActiveSectionId(section.id)}
                >
                  <div className="flex flex-col truncate min-w-0 flex-1 pr-1">
                    <span className="font-semibold truncate text-[11px]">{section.title || 'Sin título'}</span>
                    <span className={cn(
                      "text-[8px] uppercase tracking-widest mt-0.5",
                      activeSectionId === section.id ? "text-gray-400" : SECTION_TYPE_COLORS[section.type]
                    )}>
                      {PAGE_TYPE_LABELS[section.pageType || ''] || section.type}
                    </span>
                  </div>

                  <div className="flex flex-col shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); moveSection(index, 'up'); }}
                      className={cn("p-0.5 rounded", activeSectionId === section.id ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-[#1A1A1A]")}>
                      <ChevronUp size={11} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); moveSection(index, 'down'); }}
                      className={cn("p-0.5 rounded", activeSectionId === section.id ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-[#1A1A1A]")}>
                      <ChevronDown size={11} />
                    </button>
                    {book.sections.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                        className={cn("p-0.5 rounded", activeSectionId === section.id ? "text-red-300 hover:text-red-100" : "text-gray-400 hover:text-red-500")}>
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          <div className="p-3 bg-white border-t border-[#E5E4DE] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addSection('chapter')}
                className="py-2 bg-[#1A1A1A] text-white text-[9px] font-bold uppercase tracking-widest hover:bg-[#333] transition-colors flex items-center justify-center gap-1">
                <Plus size={11} /> Capítulo
              </button>
              <button onClick={() => addSection('front-matter')}
                className="py-2 bg-white border border-[#E5E4DE] text-[#1A1A1A] text-[9px] font-bold uppercase tracking-widest hover:bg-[#F0EFED] transition-colors flex items-center justify-center gap-1">
                <Plus size={11} /> Sección
              </button>
            </div>
            <button onClick={() => setIsImportModalOpen(true)}
              className="w-full py-2 bg-[#F0EFED] border border-[#E5E4DE] text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] hover:bg-white transition-colors flex items-center justify-center gap-1.5">
              <UploadCloud size={12} /> Importar Texto
            </button>
          </div>
        </div>

        {/* Right Pane: Editor */}
        <div className="flex-1 overflow-hidden flex flex-col h-full bg-white">
          {activeSection ? (
            <>
              {/* Section header */}
              <div className="border-b border-[#E5E4DE] px-6 py-3 bg-[#FAFAFA] flex items-center justify-between gap-4 shrink-0">
                <div className="flex-1 min-w-0">
                  <input
                    className="w-full font-serif text-lg font-bold placeholder-gray-300 border-none outline-none focus:ring-0 px-0 bg-transparent text-[#1A1A1A]"
                    placeholder="Título de la sección..."
                    value={activeSection.title}
                    onChange={(e) => updateSection(activeSection.id, { title: e.target.value })}
                  />
                  <div className="flex items-center gap-3 mt-1">
                    <select
                      value={activeSection.type}
                      onChange={(e) => updateSection(activeSection.id, { type: e.target.value as any })}
                      className="text-[9px] uppercase tracking-widest border-none bg-transparent focus:outline-none text-gray-400 font-bold cursor-pointer"
                    >
                      <option value="front-matter">Front Matter</option>
                      <option value="chapter">Capítulo</option>
                      <option value="part">Parte</option>
                      <option value="back-matter">Back Matter</option>
                    </select>
                    <span className="text-gray-300">·</span>
                    <select
                      value={activeSection.pageType || 'standard'}
                      onChange={(e) => updateSection(activeSection.id, { pageType: e.target.value as any })}
                      className="text-[9px] uppercase tracking-widest border-none bg-transparent focus:outline-none text-gray-400 font-bold cursor-pointer"
                    >
                      <option value="standard">Estándar</option>
                      <option value="title-page">Portada Interior</option>
                      <option value="copyright">Copyright</option>
                      <option value="dedication">Dedicatoria</option>
                      <option value="toc">Índice</option>
                      <option value="about-author">Sobre el Autor</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                  title="Generar contenido con IA"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-colors shrink-0",
                    isGeneratingAI
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A] opacity-70"
                      : "bg-white border-[#E5E4DE] text-[#1A1A1A] hover:border-amber-400 hover:text-amber-600"
                  )}
                >
                  {isGeneratingAI
                    ? <><span className="animate-spin">✦</span> Escribiendo...</>
                    : <><Sparkles size={11} /> Continuar con IA</>
                  }
                </button>
              </div>

              {/* The editor */}
              <div className="flex-1 overflow-hidden">
                <RichTextEditor
                  value={activeSection.content}
                  onChange={handleSectionContentChange}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-300 flex-col gap-4">
              <FileText size={40} strokeWidth={1} />
              <p className="text-[11px] uppercase tracking-widest font-bold">Selecciona una sección para editar</p>
            </div>
          )}
        </div>
      </div>

      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </>
  );
}

import React, { useState, useRef } from 'react';
import { useBook } from '../../context/BookContext';
import { Section } from '../../types';
import { Plus, GripVertical, Trash2, Info, FileText, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { RichTextEditor } from '../ui/RichTextEditor';
import { ImportModal } from './ImportModal';

export function EditorView() {
  const { book, updateBookDetails, addSection, updateSection, deleteSection, reorderSections } = useBook();
  const [activeSectionId, setActiveSectionId] = useState<string | null>(book.sections[0]?.id || null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const activeSection = book.sections.find(s => s.id === activeSectionId);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) reorderSections(index, index - 1);
    if (direction === 'down' && index < book.sections.length - 1) reorderSections(index, index + 1);
  };

  return (
    <>
      <div className="h-full flex flex-col md:flex-row pb-8">
        {/* Left Pane: Structure Dashboard */}
        <div className="w-full md:w-64 bg-[#FDFDFB] border-r border-[#E5E4DE] flex flex-col h-full shrink-0">
          
          {/* Quick Book Info */}
          <div className="p-4 border-b border-[#E5E4DE] bg-white relative">
             <div className="absolute top-4 right-4 z-50">
               <div className="group relative flex items-center">
                 <Info size={14} className="text-gray-400 cursor-help" />
                 <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-right">
                   Ingresa aquí el título general y el autor de toda la obra. Estos datos se usarán para la portada y encabezados.
                 </div>
               </div>
             </div>
             <input 
               className="w-full font-serif text-lg font-bold placeholder-gray-300 border-none outline-none focus:ring-0 px-0 bg-transparent mb-1 text-[#1A1A1A]" 
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

          <div className="p-4 border-b border-[#E5E4DE] flex justify-between items-center bg-[#F0EFED]">
            <h2 className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
              Estructura 
              <div className="group relative flex items-center z-50">
                <Info size={12} className="text-gray-500 cursor-help" />
                <div className="absolute left-full ml-2 w-48 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-left">
                  Organiza los capítulos. Arrastra para reordenar.
                </div>
              </div>
            </h2>
            <button onClick={() => addSection('chapter')} title="Añadir Capítulo al final" className="text-gray-500 hover:text-[#1A1A1A] bg-white p-1 shadow-sm border border-[#E5E4DE]">
              <Plus size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
            {book.sections.map((section, index) => (
              <motion.div
                key={section.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "group flex items-center justify-between p-2 text-xs border shadow-sm cursor-pointer transition-colors relative",
                  activeSectionId === section.id 
                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                    : "bg-white border-[#E5E4DE] text-[#1A1A1A] hover:border-gray-400",
                  section.type === 'chapter' && book.sections.some(s => s.type === 'part') ? "ml-4" : "" // Indent chapters if parts exist
                )}
                onClick={() => setActiveSectionId(section.id)}
              >
                <div className="flex items-center space-x-2 truncate min-w-0">
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                     <button onClick={(e) => { e.stopPropagation(); moveSection(index, 'up'); }} className={activeSectionId === section.id ? "text-gray-400" : "text-gray-400 hover:text-[#1A1A1A]"}><GripVertical size={12} /></button>
                  </div>
                  <div className="truncate flex flex-col min-w-0 pr-2">
                    <span className="font-semibold truncate">{section.title || "Sin título"}</span>
                    <span className={cn(
                      "text-[9px] uppercase tracking-widest mt-0.5",
                      activeSectionId === section.id ? "text-gray-400" : "text-gray-500"
                    )}>
                      {section.type}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center shrink-0">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      addSection('chapter', section.id);
                    }}
                    title="Añadir página a continuación"
                    className={cn(
                      "opacity-0 group-hover:opacity-100 p-1 rounded mr-1",
                      activeSectionId === section.id ? "text-gray-300 hover:text-white" : "text-gray-400 hover:text-[#1A1A1A]"
                    )}
                  >
                    <Plus size={14} />
                  </button>

                  {book.sections.length > 1 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                      title="Eliminar página"
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-1 rounded",
                        activeSectionId === section.id ? "text-red-300 hover:text-red-100" : "text-gray-400 hover:text-red-500"
                      )}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="p-4 bg-white border-t border-[#E5E4DE] flex flex-col gap-2">
           <p className="text-[9px] uppercase tracking-widest text-center opacity-60 font-bold">Total: {book.sections.length} secciones</p>
           <button 
             onClick={() => setIsImportModalOpen(true)}
             className="w-full py-2 bg-[#F0EFED] border border-[#E5E4DE] text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] hover:bg-white transition-colors"
           >
              Importar Auto (Pegar)
           </button>
        </div>
      </div>

      {/* Right Pane: Smart Form/Editor container */}
      <div className="flex-1 overflow-y-auto bg-white h-full relative p-6 md:p-12 pb-24">
        {activeSection ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-[#E5E4DE] pb-6 flex items-start justify-between">
              <div className="space-y-4 flex-1 pr-8">
                <div>
                  <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2 flex items-center gap-2">
                    Título de la Sección
                    <div className="group relative flex items-center">
                      <Info size={14} className="text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center">
                        Este título aparecerá en el índice y como cabecera o título de página según el estilo seleccionado.
                      </div>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={activeSection.title}
                    onChange={(e) => updateSection(activeSection.id, { title: e.target.value })}
                    className="w-full border-b border-[#E5E4DE] bg-transparent text-xl font-bold p-2 focus:border-[#1A1A1A] outline-none transition-colors"
                    placeholder="Ej. Introducción"
                  />
                </div>
                
                <div className="flex space-x-6">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2">Sección (Estructura)</label>
                    <select 
                      value={activeSection.type}
                      onChange={(e) => updateSection(activeSection.id, { type: e.target.value as Section['type'] })}
                      className="w-full border border-[#E5E4DE] rounded-none bg-[#FDFDFB] p-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                    >
                      <option value="front-matter">Front Matter (Sin numerar)</option>
                      <option value="part">Parte / Bloque</option>
                      <option value="chapter">Capítulo (Numerado)</option>
                      <option value="back-matter">Back Matter</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2">Plantilla (Contenido)</label>
                    <select 
                      value={activeSection.pageType || 'standard'}
                      onChange={(e) => updateSection(activeSection.id, { pageType: e.target.value as any })}
                      className="w-full border border-[#E5E4DE] rounded-none bg-[#FDFDFB] p-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                    >
                      <option value="standard">Texto Libre Estándar</option>
                      <option value="image-page">Página de Imagen (Ilustración / Mapa)</option>
                      <option value="title-page">Página de Título Automática</option>
                      <option value="copyright">Página de Derechos (Copyright)</option>
                      <option value="dedication">Dedicatoria / Epígrafe</option>
                      <option value="toc">Índice Automático</option>
                      <option value="about-author">Acerca del Autor (Bio)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              {(!activeSection.pageType || activeSection.pageType === 'standard' || activeSection.pageType === 'about-author') && (
                <div>
                  <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2 flex items-center gap-2">
                    Contenido (Texto Plano)
                    <div className="group relative flex items-center">
                       <Info size={14} className="text-gray-400 cursor-help" />
                       <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-left">
                         Pega tu texto aquí libremente. Al ingresar solo texto plano nos aseguramos de que no se rompa el formato de impresión. KDPress se encargará de las sangrías, fuentes y márgenes automáticamente.
                       </div>
                    </div>
                  </label>
                  <textarea
                    value={activeSection.content.replace(/<\/p>\s*<p>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')}
                    onChange={(e) => {
                      updateSection(activeSection.id, { content: e.target.value });
                    }}
                    className="w-full h-[400px] p-6 border border-[#E5E4DE] bg-[#FDFDFB] focus:outline-none focus:border-[#1A1A1A] font-sans text-sm leading-relaxed resize-y placeholder:text-gray-300 shadow-inner"
                    placeholder="Escribe o pega el texto aquí..."
                  />
                </div>
              )}

              {activeSection.pageType === 'title-page' && (
                <div className="bg-[#F0EFED] border border-[#E5E4DE] p-8 text-center space-y-4 shadow-sm">
                   <div className="mx-auto w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white mb-6">
                     <FileText size={24} />
                   </div>
                   <h3 className="text-xl font-bold font-serif">{book.title || 'El Título de tu Libro'}</h3>
                   {book.subtitle && <p className="text-sm italic font-serif text-gray-600">{book.subtitle}</p>}
                   <div className="w-16 h-px bg-gray-300 mx-auto my-6"></div>
                   <p className="text-xs uppercase tracking-widest text-[#1A1A1A]">{book.author || 'Nombre del Autor'}</p>
                   
                   <p className="text-[10px] text-gray-500 mt-10 max-w-sm mx-auto">Esta página se generará automáticamente usando los datos de Titulo y Autor que configuraste globalmente en "Ajustes de la Obra" o en el panel izquierdo.</p>
                </div>
              )}

              {activeSection.pageType === 'copyright' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6 bg-[#FDFDFB] p-6 border border-[#E5E4DE]">
                    <div>
                      <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2">Año de Publicación</label>
                      <input 
                        className="w-full border-b border-[#E5E4DE] bg-white p-2 text-sm focus:outline-none focus:border-[#1A1A1A]"
                        value={activeSection.meta?.year || ''}
                        placeholder={new Date().getFullYear().toString()}
                        onChange={(e) => updateSection(activeSection.id, { meta: { ...activeSection.meta, year: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2">Titular de los Derechos</label>
                      <input 
                        className="w-full border-b border-[#E5E4DE] bg-white p-2 text-sm focus:outline-none focus:border-[#1A1A1A]"
                        value={activeSection.meta?.holder || ''}
                        placeholder={book.author || 'Autor'}
                        onChange={(e) => updateSection(activeSection.id, { meta: { ...activeSection.meta, holder: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div className="bg-[#F0EFED] p-6 border border-[#E5E4DE] text-center text-[10px] uppercase tracking-widest text-gray-500">
                    <p className="mb-2">El siguiente texto se añadirá automáticamente a la página de impresión:</p>
                    <p className="font-serif italic normal-case text-sm text-[#1A1A1A]">Copyright © {activeSection.meta?.year || new Date().getFullYear().toString()} por {activeSection.meta?.holder || book.author}.<br/>Todos los derechos reservados.<br/>Ninguna parte de este libro podrá ser reproducida...</p>
                  </div>
                </div>
              )}

              {activeSection.pageType === 'dedication' && (
                <div className="bg-[#FDFDFB] p-8 border border-[#E5E4DE] min-h-[300px] flex flex-col items-center justify-center">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-200 pb-2 w-full text-center">Texto de la Dedicatoria o Epígrafe</label>
                  <textarea
                    value={activeSection.content.replace(/<[^>]+>/g, '')}
                    onChange={(e) => updateSection(activeSection.id, { content: e.target.value })}
                    className="w-full max-w-sm h-[150px] bg-transparent text-center focus:outline-none font-serif italic text-lg resize-none placeholder:text-gray-300"
                    placeholder="A mi familia..."
                  />
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-10 text-center max-w-xs">Nosotros nos encargaremos de alinearlo e indentarlo perfectamente en la hoja impresa.</p>
                </div>
              )}

              {activeSection.pageType === 'image-page' && (
                <div className="bg-[#FDFDFB] p-8 border border-[#E5E4DE] flex flex-col items-center justify-center space-y-6">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={imageInputRef} 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          updateSection(activeSection.id, { meta: { ...activeSection.meta, imageUrl: event.target?.result as string } });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="text-center w-full">
                    <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2">Imagen de la Página</label>
                    <p className="text-[10px] text-gray-500 mb-6">Ideal para mapas de fantasía, ilustraciones de personajes o gráficos. Se centrará en la página respetando los márgenes.</p>
                    
                    {activeSection.meta?.imageUrl ? (
                      <div className="relative inline-block border border-[#E5E4DE] p-2 bg-white max-w-sm w-full shadow-sm mb-4">
                        <img src={activeSection.meta.imageUrl} alt="Ilustración" className="w-full h-auto object-contain max-h-[300px]" />
                        <button 
                          onClick={() => updateSection(activeSection.id, { meta: { ...activeSection.meta, imageUrl: '' } })}
                          className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full max-w-sm mx-auto h-[200px] border-2 border-dashed border-[#E5E4DE] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                         <ImageIcon size={32} className="text-gray-300 mb-3" />
                         <span className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">Click para subir imagen</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full max-w-sm mt-4">
                     <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2">Píe de foto (Opcional)</label>
                     <input 
                       className="w-full border-b border-[#E5E4DE] bg-transparent p-2 text-sm focus:outline-none focus:border-[#1A1A1A]"
                       value={activeSection.content}
                       placeholder="Ej. Mapa de Eriador"
                       onChange={(e) => updateSection(activeSection.id, { content: e.target.value })}
                     />
                  </div>
                </div>
              )}

              {activeSection.pageType === 'toc' && (
                <div className="bg-[#F0EFED] border border-[#E5E4DE] p-8 text-center space-y-4 shadow-sm">
                   <div className="mx-auto w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white mb-6">
                     <FileText size={24} />
                   </div>
                   <h3 className="text-xl font-bold font-serif">Índice Generado Automáticamente</h3>
                   <p className="text-[10px] text-gray-500 mt-4 max-w-md mx-auto">KDPress examinará tu manuscrito al exportar y creará el índice perfecto con números de página reales adaptados a la edición impresa seleccionada. No tienes que hacer nada más aquí.</p>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-[11px]">
            <p>Selecciona una sección</p>
          </div>
        )}
      </div>
    </div>
    <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </>
  );
}

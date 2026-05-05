import React, { useState } from 'react';
import { useBook } from '../../context/BookContext';
import { cn } from '../../lib/utils';
import { Check, Info } from 'lucide-react';

export function StyleView() {
  const { book, updateBookDetails } = useBook();
  const [previewPage, setPreviewPage] = useState<'title' | 'chapter' | 'epilogue'>('title');

  const themes = [
    {
      id: 'classic-fiction',
      name: 'Novela Clásica (Ficción)',
      description: 'Diseño sobrio. Tipografía con serifas para lectura prolongada. Capítulos que empiezan a 1/3 de página.',
      fonts: 'Garamond / Crimson Text',
      previewClass: 'font-garamond'
    },
    {
      id: 'non-fiction',
      name: 'No Ficción / Educativo',
      description: 'Uso intensivo de encabezados. Espaciado limpio entre párrafos. Ideal para ensayos y manuales.',
      fonts: 'Lato + Merriweather',
      previewClass: 'font-lato'
    },
    {
      id: 'workbook',
      name: 'Libro de Trabajo',
      description: 'Márgenes laterales amplios. Espacio para completar. Tipografía de alta legibilidad.',
      fonts: 'Open Sans / Roboto',
      previewClass: 'font-open-sans'
    },
    {
      id: 'sci-fi',
      name: 'Ciencia Ficción',
      description: 'Diseño moderno y técnico. Tipografías más estructuradas y espaciados asimétricos.',
      fonts: 'Space Grotesk / JetBrains Mono',
      previewClass: 'font-mono'
    },
    {
      id: 'romance',
      name: 'Romance y Poesía',
      description: 'Diseño elegante y fluido. Tipografías refinadas con alto contraste en estilos.',
      fonts: 'Playfair Display / Lora',
      previewClass: 'font-serif'
    },
    {
      id: 'fantasy',
      name: 'Fantasía Épica',
      description: 'Clásico con toques ornamentales. Justificaciones tradicionales e inmersivas.',
      fonts: 'Cinzel / EB Garamond',
      previewClass: 'font-garamond'
    }
  ];

  // Helper to get real book data for preview
  const firstChapter = book.sections.find(s => s.type === 'chapter');
  const epilogueSection = book.sections.slice().reverse().find(s => s.type === 'back-matter' || s.title.toLowerCase().includes('epílogo'));
  
  const displayTitle = book.title || "Tu Título Aquí";
  const displayAuthor = book.author || "Nombre del Autor";
  
  // Extract plain text for preview (first 2 paragraphs approx)
  const extractText = (content: string) => {
    if (!content) return "El contenido de tu sección aparecerá aquí. Si no has escrito nada, este es un texto de prueba.";
    const plain = content.replace(/<[^>]+>/g, '\n').split('\n').filter(p => p.trim() !== '');
    return plain.slice(0, 2).join('\n\n') || "El contenido corto de tu sección.";
  };

  return (
    <div className="h-full overflow-y-auto bg-[#EBE9E4] p-6 md:p-12 pb-24">
      <div className="max-w-4xl mx-auto space-y-12 bg-white shadow-2xl p-10 border border-[#E5E4DE]">
        
        <div>
          <h2 className="text-xl font-light tracking-[0.2em] uppercase text-[#1A1A1A] mb-4 text-center">Plantillas y Estilo</h2>
          <p className="text-gray-500 text-center font-serif italic max-w-lg mx-auto">Estas plantillas definirán cómo se verá tu libro impreso e impactarán en variables como tipografía y márgenes al exportar a PDF.</p>
        </div>

        {/* Global Preview Section directly indicating selected theme */}
        <div className="bg-[#1A1A1A] p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center border border-[#1A1A1A]">
           
           <div className="flex-1 text-white space-y-4 p-4">
              <h3 className="text-lg font-bold uppercase tracking-widest text-[#F0EFED] flex items-center gap-2">
                Previsualización
                <div className="group relative flex items-center">
                  <Info size={16} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white text-[#1A1A1A] shadow-xl text-[10px] hidden group-hover:block z-50 text-center border border-[#E5E4DE]">
                    Esta es una previsualización de cómo se verá el texto impreso con los estilos de fuente seleccionados usando tus datos reales.
                  </div>
                </div>
              </h3>
              
              <div className="flex flex-col gap-2">
                <button onClick={() => setPreviewPage('title')} className={cn("text-left text-xs uppercase tracking-wider font-bold p-2 border-l-2 transition-colors", previewPage === 'title' ? "border-white text-white" : "border-gray-700 text-gray-500 hover:text-gray-300")}>Página de Título</button>
                <button onClick={() => setPreviewPage('chapter')} className={cn("text-left text-xs uppercase tracking-wider font-bold p-2 border-l-2 transition-colors", previewPage === 'chapter' ? "border-white text-white" : "border-gray-700 text-gray-500 hover:text-gray-300")}>Inicio de Capítulo</button>
                <button onClick={() => setPreviewPage('epilogue')} className={cn("text-left text-xs uppercase tracking-wider font-bold p-2 border-l-2 transition-colors", previewPage === 'epilogue' ? "border-white text-white" : "border-gray-700 text-gray-500 hover:text-gray-300")}>Epílogo / Final</button>
              </div>
           </div>
           
           <div className="w-[300px] h-[400px] bg-white shrink-0 p-8 shadow-2xl relative">
              <div className="absolute inset-y-0 left-0 w-6 bg-gray-100 border-r border-dashed border-gray-300"></div>
              
              <div className={cn(
                "h-full overflow-hidden ml-4 flex flex-col items-center justify-center relative",
                book.theme === 'classic-fiction' ? "font-garamond text-[12px] leading-relaxed" : 
                book.theme === 'non-fiction' ? "font-lato text-[11px] leading-normal" : 
                "font-open-sans text-[11px] leading-loose text-justify"
              )}>
                 {previewPage === 'title' && (
                    <div className="text-center w-full mt-10">
                       <h1 className={cn(
                         "text-[#1A1A1A] mb-8 uppercase tracking-[0.2em]",
                         book.theme === 'classic-fiction' ? "text-2xl font-light" : 
                         book.theme === 'non-fiction' ? "text-3xl font-bold" : "text-xl font-bold border-b border-[#1A1A1A] pb-4 inline-block"
                       )}>{displayTitle}</h1>
                       
                       {book.subtitle && (
                         <div className="text-sm text-gray-600 mb-10 italic uppercase tracking-wider">{book.subtitle}</div>
                       )}

                       <div className="mt-20 pt-10 border-t border-gray-200 uppercase tracking-widest text-[9px] font-bold text-gray-500">
                         Por<br/>
                         <span className="text-[#1A1A1A] text-sm mt-2 block">{displayAuthor}</span>
                       </div>
                    </div>
                 )}

                 {previewPage === 'chapter' && (
                    <div className="absolute top-10 inset-x-0 bottom-0 text-left">
                       <div className={cn(
                         "mb-8 text-center",
                         book.theme === 'classic-fiction' ? "uppercase tracking-[0.2em] text-lg font-light mt-10" : 
                         book.theme === 'non-fiction' ? "font-bold text-xl uppercase tracking-wider py-4 border-y border-gray-100 mb-6" : 
                         "font-bold text-lg border-b border-[#1A1A1A] pb-2 inline-block w-full text-left"
                       )}>{firstChapter?.title || "Capítulo 1"}</div>
                       
                       {extractText(firstChapter?.content || "").split('\n\n').map((p, i) => (
                         <p key={i} className={cn(
                           "text-justify mb-2",
                           book.theme === 'classic-fiction' && i > 0 ? "text-indent-[1.5em] mb-0" : "mb-3"
                         )} style={{ textIndent: (book.theme === 'classic-fiction' && i > 0) ? '1.5em' : '0' }}>
                           {p}
                         </p>
                       ))}
                    </div>
                 )}

                 {previewPage === 'epilogue' && (
                    <div className="absolute top-10 inset-x-0 bottom-0 text-left">
                       <div className={cn(
                         "mb-8 text-center",
                         book.theme === 'classic-fiction' ? "italic text-lg font-light mt-10" : 
                         book.theme === 'non-fiction' ? "font-bold text-sm uppercase tracking-widest text-center" : 
                         "font-bold text-sm bg-gray-100 p-2 text-center"
                       )}>{epilogueSection?.title || "Epílogo"}</div>
                       
                       {extractText(epilogueSection?.content || "El telón finalmente cae. Todo lo que debía decirse, fue dicho.").split('\n\n').map((p, i) => (
                         <p key={i} className={cn(
                           "text-justify text-sm italic",
                           "mb-3"
                         )}>
                           {p}
                         </p>
                       ))}
                       
                       <div className="mt-10 text-center font-bold text-[9px] uppercase tracking-widest">Fin</div>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Themes Selection */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-[#E5E4DE] pb-2 text-center flex items-center justify-center gap-2">
            Diseño del Interior 
            <div className="group relative flex items-center">
              <Info size={12} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center">
                Selecciona la plantilla gráfica que corresponde al género de tu libro.
              </div>
            </div>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <div 
                key={theme.id}
                onClick={() => updateBookDetails({ theme: theme.id as any })}
                className={cn(
                  "relative bg-[#FDFDFB] border p-6 cursor-pointer transition-all hover:shadow-lg group",
                  book.theme === theme.id 
                    ? "border-[#1A1A1A] shadow-md" 
                    : "border-[#E5E4DE] hover:border-gray-400"
                )}
              >
                {book.theme === theme.id && (
                  <div className="absolute -top-3 -right-3 bg-[#1A1A1A] text-white p-1 rounded-full shadow-md">
                    <Check size={14} />
                  </div>
                )}
                
                <div className="aspect-[3/4] bg-[#F0EFED] mb-4 border border-[#E5E4DE] p-4 flex flex-col gap-2 items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                   <div className={cn("text-5xl text-[#1A1A1A] opacity-50", theme.previewClass)}>Aa</div>
                </div>

                <h4 className="font-bold text-[11px] uppercase tracking-widest text-[#1A1A1A] mb-2">{theme.name}</h4>
                <p className="text-xs text-gray-500 mb-4 h-12">{theme.description}</p>
                <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 border-t border-[#E5E4DE] pt-3">
                  {theme.fonts}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Physical Attributes */}
        <div className="space-y-6 pt-8 border-t border-[#E5E4DE]">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-[#E5E4DE] pb-2 text-center flex items-center justify-center gap-2">
            Atributos Físicos (Impresión) 
            <div className="group relative flex items-center">
              <Info size={12} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center">
                Estas opciones definen el libro físico. Son necesarias para calcular márgenes interiores y grosores de lomo.
              </div>
            </div>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 relative">
              <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                Tipo de Papel
                <div className="group relative flex items-center">
                  <Info size={12} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center">
                    El tipo de papel afecta al grosor final del libro y, por lo tanto, a la medida del lomo de la portada.
                  </div>
                </div>
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => updateBookDetails({ paperType: 'cream' })}
                  className={cn(
                    "flex-1 py-3 px-4 border flex items-center justify-center space-x-2 transition-colors",
                    book.paperType === 'cream' ? "bg-[#F7F6F3] border-[#1A1A1A] text-[#1A1A1A]" : "bg-white border-[#E5E4DE] hover:bg-[#F0EFED] text-gray-500"
                  )}
                >
                  <div className="w-3 h-3 rounded-full bg-[#FDFBF7] border border-gray-300"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Crema</span>
                </button>
                <button
                  onClick={() => updateBookDetails({ paperType: 'white' })}
                  className={cn(
                    "flex-1 py-3 px-4 border flex items-center justify-center space-x-2 transition-colors",
                    book.paperType === 'white' ? "bg-white border-[#1A1A1A] text-[#1A1A1A]" : "bg-white border-[#E5E4DE] hover:bg-[#F0EFED] text-gray-500"
                  )}
                >
                  <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Blanco</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 relative">
              <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                Tamaño de Corte (Trim Size)
                <div className="group relative flex items-center">
                  <Info size={12} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center">
                    Corresponde a las medidas finales del libro impreso cerrado. 6x9 es el formato más popular en plataformas como KDP.
                  </div>
                </div>
              </label>
              <select 
                value={book.trimSize}
                onChange={(e) => updateBookDetails({ trimSize: e.target.value as any })}
                className="w-full border border-[#E5E4DE] p-3 text-xs font-bold text-[#1A1A1A] uppercase tracking-widest hover:border-gray-400 focus:outline-none focus:border-[#1A1A1A] bg-transparent appearance-none rounded-none"
              >
                <option value="5x8">5 x 8 pulgadas (12.7 x 20.32 cm)</option>
                <option value="6x9">6 x 9 pulgadas (15.24 x 22.86 cm)</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

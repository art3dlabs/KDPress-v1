import React, { useState, useRef } from 'react';
import { useBook } from '../../context/BookContext';
import { Info, ImagePlus, UploadCloud, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export function CoverView() {
  const { book, updateBookDetails } = useBook();
  const [estimatedPages, setEstimatedPages] = useState(250);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [includeTextAI, setIncludeTextAI] = useState(false);
  const [coverPromptDetails, setCoverPromptDetails] = useState('');
  const frontCoverInputRef = useRef<HTMLInputElement>(null);
  const backCoverInputRef = useRef<HTMLInputElement>(null);
  const refImagesInputRef = useRef<HTMLInputElement>(null);

  const spineMultiplier = book.paperType === 'cream' ? 0.0635 : 0.0572; 
  const spineWidthMM = estimatedPages * spineMultiplier;
  const spineWidthInches = spineWidthMM / 25.4;

  const handleRefImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      let processed = 0;
      const newImages: string[] = [];
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result as string);
          }
          processed++;
          if (processed === files.length) {
            setReferenceImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    // Clear input
    if (refImagesInputRef.current) refImagesInputRef.current.value = '';
  };

  const handleDirectCoverUpload = (e: React.ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
         if (event.target?.result) {
            if (isFront) {
               updateBookDetails({ coverImage: event.target.result as string });
            } else {
               updateBookDetails({ backCoverImage: event.target.result as string });
            }
         }
      };
      reader.readAsDataURL(file);
    }
    if (isFront && frontCoverInputRef.current) frontCoverInputRef.current.value = '';
    if (!isFront && backCoverInputRef.current) backCoverInputRef.current.value = '';
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadImage = (base64Str: string, name: string) => {
    const a = document.createElement('a');
    a.href = base64Str;
    a.download = `${name}.png`;
    a.click();
  };

  const handleGenerateCoverAI = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const parts: any[] = [];
      
      referenceImages.forEach(base64Str => {
        const mimeType = base64Str.split(';')[0].split(':')[1];
        const base64Data = base64Str.split(',')[1];
        parts.push({
          inlineData: { data: base64Data, mimeType }
        });
      });

      let themeDescription = '';
      switch (book.theme) {
        case 'sci-fi': themeDescription = "sci-fi, futuristic, technological, dark space elements"; break;
        case 'classic-fiction': themeDescription = "classic literature, elegant, traditional, literary fiction style"; break;
        case 'non-fiction': themeDescription = "non-fiction, clean, educational, minimalistic, documentary style"; break;
        case 'romance': themeDescription = "romance, poetry, warm, emotional, soft aesthetics"; break;
        case 'fantasy': themeDescription = "epic fantasy, magical, immersive, ancient lore, dragons, swords"; break;
        case 'workbook': themeDescription = "workbook, practical, structured, geometric, modern"; break;
        default: themeDescription = "professional book cover"; break;
      }

      let frontTextPrompt = `Generate a high-quality professional front book cover art for a book with theme: ${themeDescription}. `;
      
      if (coverPromptDetails) {
        frontTextPrompt += `Specific user requests for the cover design: "${coverPromptDetails}". `;
      }

      if (referenceImages.length > 0) {
        frontTextPrompt += "Use the provided images as inspiration for characters, locations, or compositional style. ";
      }

      if (includeTextAI) {
        frontTextPrompt += `The title of the book is "${book.title || 'Untitled'}" and the author is "${book.author || 'Author'}". Please incorporate this typography beautifully and clearly into the design, paying attention to hierarchy and style matching the theme. `;
      } else {
        frontTextPrompt += "CRITICAL: Do NOT include any text, typography, letters, words, or titles in the image. I only want the pure artwork background. ";
      }

      parts.push({
        text: frontTextPrompt
      });

      const frontPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts }
      });

      // --- Back Cover Generation ---
      const backParts: any[] = [];
      referenceImages.forEach(base64Str => {
        const mimeType = base64Str.split(';')[0].split(':')[1];
        const base64Data = base64Str.split(',')[1];
        backParts.push({
          inlineData: { data: base64Data, mimeType }
        });
      });

      let backTextPrompt = "";
      if (referenceImages.length > 0) {
         backTextPrompt = `Based on the attached reference images, generate a matching abstract background art for the back cover of a book with theme ${themeDescription}. The composition must leave room for the synopsis text. CRITICAL: Do NOT include any text.`;
      } else {
         backTextPrompt = `Generate an abstract, surreal back cover art piece inspired by this synopsis: "${book.backCoverText || 'Mistery and intrigue'}". The composition must leave room for text. CRITICAL: Do NOT include any text, typography, letters, words, or titles in the image.`;
      }
      backParts.push({ text: backTextPrompt });

      const backPromise = ai.models.generateContent({
         model: 'gemini-2.5-flash-image',
         contents: { parts: backParts }
      });

      const [frontResponse, backResponse] = await Promise.all([frontPromise, backPromise]);

      let newFrontImage = book.coverImage;
      if (frontResponse.candidates && frontResponse.candidates[0].content.parts) {
        for (const part of frontResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            newFrontImage = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      let newBackImage = book.backCoverImage;
      if (backResponse.candidates && backResponse.candidates[0].content.parts) {
        for (const part of backResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            newBackImage = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      updateBookDetails({ coverImage: newFrontImage, backCoverImage: newBackImage });
    } catch (e) {
      console.error(e);
      alert('Error al generar la portada con Inteligencia Artificial.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#EBE9E4] p-6 md:p-12 pb-24">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <div>
          <h2 className="text-xl font-light tracking-[0.2em] uppercase text-[#1A1A1A] mb-4 text-center">Calculadora de Lomo & Portada</h2>
          <p className="text-gray-500 text-center font-serif italic max-w-lg mx-auto">Calcula las dimensiones exactas para tu portada completa (Contraportada + Lomo + Portada Frontal).</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Metadata Form */}
          <div className="lg:col-span-1 space-y-8 bg-white p-8 shadow-xl border border-[#E5E4DE]">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2 flex items-center gap-2">Título</label>
                <input 
                  type="text" 
                  value={book.title} 
                  onChange={(e) => updateBookDetails({ title: e.target.value })}
                  className="w-full border-b border-[#E5E4DE] bg-transparent text-sm p-2 focus:border-[#1A1A1A] outline-none transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2 flex items-center gap-2">Autor</label>
                <input 
                  type="text" 
                  value={book.author} 
                  onChange={(e) => updateBookDetails({ author: e.target.value })}
                  className="w-full border-b border-[#E5E4DE] bg-transparent text-sm p-2 focus:border-[#1A1A1A] outline-none transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2 flex items-center gap-2">
                  Páginas Estimadas 
                  <div className="group relative flex items-center">
                    <Info size={12} className="text-gray-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1A1A1A] text-white text-[10px] hidden group-hover:block z-50 text-center">
                      Ingresa un estimado de páginas de tu libro impreso para calcular el grosor del lomo. Modifícalo si conoces el número exacto, o deja el valor que el sistema estima basado en la cantidad de secciones.
                    </div>
                  </div>
                </label>
                <input 
                  type="number" 
                  value={estimatedPages} 
                  onChange={(e) => setEstimatedPages(Number(e.target.value))}
                  className="w-full border border-[#E5E4DE] text-sm p-3 focus:border-[#1A1A1A] outline-none" 
                />
                <p className="text-xs text-gray-400 mt-2 italic font-serif">Basado en tu contenido hay ~{Math.max(10, Math.floor(book.sections.length * 15))} págs.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E5E4DE]">
               <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Portadas Finales</h4>
               <input type="file" accept="image/*" className="hidden" ref={frontCoverInputRef} onChange={(e) => handleDirectCoverUpload(e, true)} />
               <input type="file" accept="image/*" className="hidden" ref={backCoverInputRef} onChange={(e) => handleDirectCoverUpload(e, false)} />
               <div className="space-y-4">
                 <div className="flex gap-2">
                   <button 
                     onClick={() => frontCoverInputRef.current?.click()}
                     className="flex-1 flex items-center justify-center gap-2 bg-white border border-[#E5E4DE] text-[#1A1A1A] p-3 text-xs font-bold uppercase tracking-widest hover:border-[#1A1A1A] transition-colors"
                   >
                     <UploadCloud size={16} /> Subir Portada
                   </button>
                   <button 
                     onClick={() => backCoverInputRef.current?.click()}
                     className="flex-1 flex items-center justify-center gap-2 bg-white border border-[#E5E4DE] text-[#1A1A1A] p-3 text-xs font-bold uppercase tracking-widest hover:border-[#1A1A1A] transition-colors"
                   >
                     <UploadCloud size={16} /> Subir Contratapa
                   </button>
                 </div>
               </div>
            </div>

            <div className="pt-6 border-t border-[#E5E4DE]">
               <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Generador de Portada IA</h4>
               <input type="file" accept="image/*" multiple className="hidden" ref={refImagesInputRef} onChange={handleRefImagesUpload} />
               <div className="space-y-4">
                 <button 
                   onClick={() => refImagesInputRef.current?.click()}
                   className="w-full flex items-center justify-center gap-2 bg-white border border-[#E5E4DE] text-[#1A1A1A] p-3 text-xs font-bold uppercase tracking-widest hover:border-[#1A1A1A] transition-colors"
                 >
                   <UploadCloud size={16} /> Subir Imágenes de Referencia
                 </button>
                 
                 {referenceImages.length > 0 && (
                   <div className="flex flex-wrap gap-2">
                     {referenceImages.map((img, i) => (
                       <div key={i} className="relative w-16 h-16 border border-[#E5E4DE] overflow-hidden group">
                         <img src={img} alt={`Ref ${i}`} className="w-full h-full object-cover" />
                         <button 
                           onClick={() => removeReferenceImage(i)}
                           className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           ×
                         </button>
                       </div>
                     ))}
                   </div>
                 )}

                 <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                   <input 
                     type="checkbox" 
                     checked={book.hideTextOnCover || false}
                     onChange={(e) => updateBookDetails({ hideTextOnCover: e.target.checked })}
                     className="accent-[#1A1A1A]"
                   />
                   Ocultar Textos Sobre Portada (No superponer título/autor)
                 </label>

                 <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                   <input 
                     type="checkbox" 
                     checked={includeTextAI}
                     onChange={(e) => setIncludeTextAI(e.target.checked)}
                     className="accent-[#1A1A1A]"
                   />
                   Generar Texto con IA (El modelo intentará dibujar el título)
                 </label>

                 <div>
                   <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-2">Detalles Específicos para la Portada</label>
                   <textarea 
                     value={coverPromptDetails}
                     onChange={(e) => setCoverPromptDetails(e.target.value)}
                     placeholder="Ej: Un castillo en ruinas bajo una luna roja..."
                     className="w-full border border-[#E5E4DE] bg-white p-2 text-xs focus:outline-none focus:border-[#1A1A1A] h-20 resize-none"
                   />
                 </div>

                 <button 
                   onClick={handleGenerateCoverAI}
                   disabled={isGenerating}
                   className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] text-white p-3 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 mt-4"
                 >
                   {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                   Generar con IA
                 </button>

                 {(book.coverImage || book.backCoverImage) && (
                   <div className="flex gap-2 mt-4 pt-4 border-t border-[#E5E4DE]">
                     {book.coverImage && (
                       <button 
                         onClick={() => handleDownloadImage(book.coverImage!, `${book.title}_portada`)}
                         className="flex-1 text-center text-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest border border-[#E5E4DE] py-2 hover:bg-[#F7F6F3]"
                       >
                         Descargar Portada
                       </button>
                     )}
                     {book.backCoverImage && (
                       <button 
                         onClick={() => handleDownloadImage(book.backCoverImage!, `${book.title}_contratapa`)}
                         className="flex-1 text-center text-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest border border-[#E5E4DE] py-2 hover:bg-[#F7F6F3]"
                       >
                         Descargar Contratapa
                       </button>
                     )}
                   </div>
                 )}
               </div>
            </div>

            <div className="pt-6 border-t border-[#E5E4DE]">
               <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Dimensiones KDP Requeridas</h4>
               <div className="bg-[#1A1A1A] text-white p-4 font-mono text-xs space-y-2 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rotate-45 transform translate-x-8 -translate-y-8"></div>
                 <p className="flex justify-between"><span>Lomo (mm):</span> <span>{spineWidthMM.toFixed(2)}</span></p>
                 <p className="flex justify-between"><span>Lomo (in):</span> <span className="opacity-70">{spineWidthInches.toFixed(3)}</span></p>
               </div>
            </div>
          </div>

          {/* Cover Preview Area */}
          <div className="lg:col-span-2 bg-[#F7F6F3] border border-[#E5E4DE] p-8 flex flex-col items-center justify-center min-h-[500px]">
            {/* Visual representation of the full cover wrapper */}
            <div 
              className="relative flex shadow-2xl bg-[#EBE9E4] transition-all transform hover:scale-[1.02] duration-500" 
              style={{ height: '450px' }}
            >
               {/* Back cover */}
               <div 
                 className="w-[300px] h-full p-8 flex flex-col justify-end text-white/80 border-r border-[#333] relative bg-cover bg-center overflow-hidden"
                 style={{ backgroundImage: book.backCoverImage ? `url(${book.backCoverImage})` : 'none', backgroundColor: book.backCoverImage ? 'transparent' : '#1A1A1A' }}
               >
                 <div className={`absolute inset-0 z-0 ${book.backCoverImage ? 'bg-black/40' : ''}`}></div>
                 
                 {!book.hideTextOnCover && (
                   <div className="z-10 w-full bg-white/10 border border-white/20 mb-6 flex flex-col items-center justify-center p-4 text-center overflow-y-auto" style={{ maxHeight: '200px' }}>
                      <p className="text-[10px] text-white/90 leading-relaxed font-serif break-words">{book.backCoverText || 'Sinopsis o texto de la contratapa del libro.'}</p>
                   </div>
                 )}
                 <div className="z-10 w-20 h-32 bg-white/90 self-end flex items-center justify-center shrink-0">
                    <div className="flex flex-col gap-1 items-end w-3/4">
                       <div className="h-1 bg-black w-full"></div>
                       <div className="h-1 bg-black w-4/5"></div>
                       <div className="h-1 bg-black w-full"></div>
                       <div className="h-1 bg-black w-3/4"></div>
                       <div className="h-1 bg-black w-full"></div>
                       <div className="h-1 bg-black w-2/3"></div>
                    </div>
                 </div> 
               </div>
               
               {/* Spine */}
               <div 
                 className={`h-full flex items-center justify-center relative overflow-hidden shrink-0 border-r border-[#333] ${!book.coverImage ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]'}`}
                 style={{ width: `${Math.max(20, spineWidthMM * 2.5)}px` }}
               >
                  {!book.hideTextOnCover && (
                    <p className="whitespace-nowrap transform -rotate-90 text-white font-bold tracking-widest text-xs uppercase z-10" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                       {book.title || 'TÍTULO'}
                    </p>
                  )}
               </div>
               
               {/* Front cover */}
               <div 
                 className="w-[300px] h-full p-10 flex flex-col items-center text-center relative border border-[#E5E4DE] bg-cover bg-center overflow-hidden"
                 style={{ backgroundImage: book.coverImage ? `url(${book.coverImage})` : 'none', backgroundColor: book.coverImage ? 'transparent' : '#FAFAF9' }}
               >
                 <div className={`absolute inset-0 z-0 ${book.coverImage ? 'bg-black/20' : ''}`}></div>
                 
                 <div className={`absolute inset-4 z-10 border ${!book.coverImage && !book.hideTextOnCover ? 'border-[#1A1A1A]' : 'border-white/50'}`}></div>
                 
                 {!book.hideTextOnCover && (
                   <div className="z-10 flex flex-col h-full w-full">
                     <h1 className={`text-3xl font-light tracking-[0.1em] font-serif mt-12 mb-4 leading-tight uppercase ${book.coverImage ? 'text-white' : 'text-[#1A1A1A] drop-shadow-md'}`}>
                       {book.title || 'TÍTULO DEL LIBRO'}
                     </h1>
                     <p className={`font-sans tracking-[0.2em] text-[10px] uppercase mt-auto mb-12 ${book.coverImage ? 'text-white/90 drop-shadow-md' : 'text-gray-500'}`}>
                       {book.author || 'NOMBRE DEL AUTOR'}
                     </p>
                   </div>
                 )}
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

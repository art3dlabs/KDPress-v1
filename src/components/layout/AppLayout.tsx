import React, { useRef, useState } from 'react';
import { Book, LayoutTemplate, Settings, Download, Image as ImageIcon, Menu, X, BookOpen, Save, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useBook } from '../../context/BookContext';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AppLayout({ children, activeTab, setActiveTab }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { book, loadBook } = useBook();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: 'editor', label: 'Estructura', icon: Book },
    { id: 'style', label: 'Plantillas', icon: LayoutTemplate },
    { id: 'cover', label: 'Portada', icon: ImageIcon },
    { id: 'settings', label: 'Ajustes', icon: Settings },
    { id: 'export', label: 'Exportar', icon: Download },
  ];

  const handleSaveProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(book));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "kdpress-proyecto.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedBook = JSON.parse(e.target?.result as string);
          loadBook(loadedBook);
        } catch (error) {
          alert("Error al cargar el archivo del proyecto.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex h-screen bg-[#F7F6F3] overflow-hidden font-sans text-[#1A1A1A]">
      {/* Mobile menu button */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-none shadow-sm border border-[#E5E4DE]"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E5E4DE] transition-transform duration-300 ease-in-out transform flex flex-col shrink-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 px-6 flex items-center space-x-3 border-b border-[#E5E4DE]">
          <div className="w-8 h-8 bg-[#1A1A1A] flex items-center justify-center text-white font-serif text-xl italic shrink-0">
            A
          </div>
          <span className="font-bold tracking-tight text-lg uppercase truncate">Aurea Publish</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors",
                  isActive 
                    ? "bg-[#1A1A1A] text-white shadow-md" 
                    : "text-gray-500 hover:bg-[#F0EFED] hover:text-[#1A1A1A] border border-transparent hover:border-[#E5E4DE]"
                )}
              >
                <Icon size={16} className={isActive ? "text-white" : "opacity-60"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E5E4DE] bg-[#FDFDFB]">
          <div className="bg-white border border-[#E5E4DE] p-4 text-[10px]">
            <p className="font-bold text-[#1A1A1A] uppercase tracking-widest mb-1">Versión Pro</p>
            <p className="text-gray-500 mb-3">Exportación PDF/X-1a ilimitada.</p>
            <button className="w-full bg-transparent border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white py-2 font-bold uppercase tracking-widest transition-colors">
              Mejorar plan
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* Header Navigation simulation */}
        <header className="h-16 border-b border-[#E5E4DE] bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Proyecto Actual</span>
            <span className="text-sm font-medium italic font-serif">{book.title || 'Borrador Final'}</span>
          </div>
          <div className="flex items-center gap-3">
             <input 
               type="file" 
               accept=".json" 
               ref={fileInputRef} 
               style={{ display: 'none' }} 
               onChange={handleLoadProject}
             />
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="hidden md:flex items-center gap-2 bg-white border border-[#E5E4DE] hover:border-[#1A1A1A] px-3 py-1.5 transition-colors text-[10px] font-bold uppercase tracking-widest"
               title="Cargar Proyecto"
             >
                <Upload size={14} />
                <span>Cargar</span>
             </button>
             <button 
               onClick={handleSaveProject}
               className="hidden md:flex items-center gap-2 bg-[#1A1A1A] text-white hover:bg-white hover:text-[#1A1A1A] border border-[#1A1A1A] px-3 py-1.5 transition-colors text-[10px] font-bold uppercase tracking-widest"
               title="Guardar Proyecto"
             >
                <Save size={14} />
                <span>Guardar</span>
             </button>
             <div className="hidden md:flex items-center gap-2 bg-[#F0EFED] px-3 py-1.5 rounded-full ml-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-bold uppercase opacity-80">Online</span>
              </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden bg-[#EBE9E4] relative">
          {children}
        </div>
        
        {/* Footer info bar */}
        <footer className="h-8 border-t border-[#E5E4DE] bg-white flex items-center justify-between px-6 shrink-0 z-10 w-full absolute bottom-0 left-0 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <span>KDP ready</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-gray-400">
            <span className="text-[#1A1A1A] font-bold">Auto-Guardado hace 1m</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

import React, { useRef, useState, useEffect } from 'react';
import { Book, LayoutTemplate, Settings, Download, Image as ImageIcon, Menu, X, Save, Upload, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useBook } from '../../context/BookContext';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AppLayout({ children, activeTab, setActiveTab }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const { book, loadBook, lastSaved } = useBook();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: 'editor', label: 'Estructura', icon: Book },
    { id: 'style', label: 'Plantillas', icon: LayoutTemplate },
    { id: 'cover', label: 'Portada', icon: ImageIcon },
    { id: 'settings', label: 'Ajustes', icon: Settings },
    { id: 'export', label: 'Exportar', icon: Download },
  ];

  const formatSaved = (d: Date | null) => {
    if (!d) return 'Sin guardar';
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 5) return 'Guardado ahora';
    if (diff < 60) return `Hace ${diff}s`;
    return `Hace ${Math.floor(diff / 60)}m`;
  };

  const [savedLabel, setSavedLabel] = useState('Sin guardar');
  useEffect(() => {
    setSavedLabel(formatSaved(lastSaved));
    setSaveFlash(true);
    const t = setTimeout(() => setSaveFlash(false), 600);
    const interval = setInterval(() => setSavedLabel(formatSaved(lastSaved)), 15000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, [lastSaved]);

  const handleSaveProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(book));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "kdpress-proyecto.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedBook = JSON.parse(e.target?.result as string);
          loadBook(loadedBook);
        } catch {
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
            K
          </div>
          <span className="font-bold tracking-tight text-lg uppercase truncate">KDPress</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors",
                  isActive
                    ? "bg-[#1A1A1A] text-white shadow-md"
                    : "text-gray-500 hover:bg-[#F0EFED] hover:text-[#1A1A1A] border border-transparent hover:border-[#E5E4DE]"
                )}
              >
                <Icon size={15} className={isActive ? "text-white" : "opacity-60"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E5E4DE]">
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
            saveFlash ? "text-green-700" : "text-gray-400"
          )}>
            <Clock size={11} />
            <span>{savedLabel}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <header className="h-16 border-b border-[#E5E4DE] bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Proyecto Actual</span>
            <span className="text-sm font-medium italic font-serif truncate max-w-[200px]">{book.title || 'Borrador Final'}</span>
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
              <Upload size={13} />
              <span>Cargar</span>
            </button>
            <button
              onClick={handleSaveProject}
              className="hidden md:flex items-center gap-2 bg-[#1A1A1A] text-white hover:bg-white hover:text-[#1A1A1A] border border-[#1A1A1A] px-3 py-1.5 transition-colors text-[10px] font-bold uppercase tracking-widest"
              title="Exportar proyecto JSON"
            >
              <Save size={13} />
              <span>Exportar JSON</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden bg-[#EBE9E4] relative">
          {children}
        </div>
      </main>
    </div>
  );
}

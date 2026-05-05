import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Book, Section } from '../types';

interface BookContextType {
  book: Book;
  updateBookDetails: (details: Partial<Book>) => void;
  addSection: (type: Section['type'], afterId?: string) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  deleteSection: (id: string) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  importSections: (sections: Omit<Section, 'id'>[], replace?: boolean) => void;
  loadBook: (book: Book) => void;
  lastSaved: Date | null;
}

const defaultBook: Book = {
  id: '1',
  title: 'Mi Nuevo Libro',
  author: 'Autor Independiente',
  paperType: 'cream',
  trimSize: '6x9',
  theme: 'classic-fiction',
  sections: [
    { id: 's1', type: 'front-matter', pageType: 'title-page', title: 'Página del Título', content: '' },
    { id: 's2', type: 'front-matter', pageType: 'copyright', title: 'Derechos de Autor', content: '', meta: { year: '2024', holder: 'Autor Independiente' } },
    { id: 's3', type: 'chapter', pageType: 'standard', title: 'Capítulo 1', content: '<p>Era una noche oscura y tormentosa...</p>' },
  ],
};

const STORAGE_KEY = 'kdpress_book_v2';

function loadFromStorage(): Book | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Book;
  } catch {
    return null;
  }
}

function saveToStorage(book: Book) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
  } catch {
    console.warn('Could not save to localStorage');
  }
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider = ({ children }: { children: ReactNode }) => {
  const [book, setBook] = useState<Book>(() => loadFromStorage() ?? defaultBook);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage(book);
      setLastSaved(new Date());
    }, 800);
    return () => clearTimeout(timer);
  }, [book]);

  const updateBookDetails = (details: Partial<Book>) => {
    setBook((prev) => ({ ...prev, ...details }));
  };

  const addSection = (type: Section['type'], afterId?: string) => {
    const newSection: Section = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      pageType: 'standard',
      title: type === 'chapter' ? 'Nuevo Capítulo' : type === 'part' ? 'Nueva Parte' : 'Nueva Sección',
      content: '',
    };
    setBook((prev) => {
      if (afterId) {
        const index = prev.sections.findIndex(s => s.id === afterId);
        if (index !== -1) {
          const newSections = [...prev.sections];
          newSections.splice(index + 1, 0, newSection);
          return { ...prev, sections: newSections };
        }
      }
      return { ...prev, sections: [...prev.sections, newSection] };
    });
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setBook((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const deleteSection = (id: string) => {
    setBook((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }));
  };

  const reorderSections = (startIndex: number, endIndex: number) => {
    setBook((prev) => {
      const result = Array.from(prev.sections);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { ...prev, sections: result };
    });
  };

  const importSections = (newSections: Omit<Section, 'id'>[], replace = false) => {
    const freshSections = newSections.map(s => ({
      ...s,
      id: Math.random().toString(36).substring(2, 9)
    }));
    setBook((prev) => ({
      ...prev,
      sections: replace ? freshSections : [...prev.sections, ...freshSections]
    }));
  };

  const loadBook = (newBook: Book) => {
    setBook(newBook);
  };

  return (
    <BookContext.Provider
      value={{
        book,
        updateBookDetails,
        addSection,
        updateSection,
        deleteSection,
        reorderSections,
        importSections,
        loadBook,
        lastSaved,
      }}
    >
      {children}
    </BookContext.Provider>
  );
};

export const useBook = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
};

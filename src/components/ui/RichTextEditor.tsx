import React, { useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, List, Undo, Redo } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  // Sync content when switching sections (value prop changes)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
      // Preserve cursor at end
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCmd = (command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  const wordCount = value.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const charCount = value.replace(/<[^>]+>/g, '').length;

  const ToolBtn = ({ title, onClick, children, active = false }: {
    title: string; onClick: () => void; children: React.ReactNode; active?: boolean;
  }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        active ? "bg-[#1A1A1A] text-white" : "text-[#1A1A1A] hover:bg-[#F0EFED]"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#E5E4DE] bg-[#FAFAFA] flex-wrap">
        <ToolBtn title="Título H1" onClick={() => execCmd('formatBlock', 'H1')}>
          <Heading1 size={15} />
        </ToolBtn>
        <ToolBtn title="Título H2" onClick={() => execCmd('formatBlock', 'H2')}>
          <Heading2 size={15} />
        </ToolBtn>
        <div className="w-px h-4 bg-[#E5E4DE] mx-1" />
        <ToolBtn title="Negrita (Ctrl+B)" onClick={() => execCmd('bold')}>
          <Bold size={14} />
        </ToolBtn>
        <ToolBtn title="Cursiva (Ctrl+I)" onClick={() => execCmd('italic')}>
          <Italic size={14} />
        </ToolBtn>
        <div className="w-px h-4 bg-[#E5E4DE] mx-1" />
        <ToolBtn title="Lista" onClick={() => execCmd('insertUnorderedList')}>
          <List size={14} />
        </ToolBtn>
        <div className="w-px h-4 bg-[#E5E4DE] mx-1" />
        <ToolBtn title="Alinear izquierda" onClick={() => execCmd('justifyLeft')}>
          <AlignLeft size={14} />
        </ToolBtn>
        <ToolBtn title="Centrar" onClick={() => execCmd('justifyCenter')}>
          <AlignCenter size={14} />
        </ToolBtn>
        <ToolBtn title="Alinear derecha" onClick={() => execCmd('justifyRight')}>
          <AlignRight size={14} />
        </ToolBtn>
        <div className="w-px h-4 bg-[#E5E4DE] mx-1" />
        <ToolBtn title="Deshacer (Ctrl+Z)" onClick={() => execCmd('undo')}>
          <Undo size={14} />
        </ToolBtn>
        <ToolBtn title="Rehacer (Ctrl+Y)" onClick={() => execCmd('redo')}>
          <Redo size={14} />
        </ToolBtn>

        <div className="ml-auto text-[9px] text-gray-400 font-bold uppercase tracking-widest">
          {wordCount.toLocaleString()} palabras · {charCount.toLocaleString()} caracteres
        </div>
      </div>

      {/* Editor canvas */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
        className="flex-1 px-12 py-10 outline-none overflow-y-auto text-[#1A1A1A] text-base leading-relaxed"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '15px',
          lineHeight: '1.85',
          minHeight: '400px',
          maxWidth: '680px',
          margin: '0 auto',
          width: '100%',
        }}
        spellCheck
      />
    </div>
  );
}

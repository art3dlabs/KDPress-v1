import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []); 

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-white relative pb-8">
      {/* Floating Toolbar inside editor */}
      <div className="absolute top-4 right-4 z-20 flex items-center bg-white px-4 py-2 rounded-full shadow-lg border border-[#E5E4DE] gap-4">
        <div className="flex items-center gap-1 border-r border-[#E5E4DE] pr-4">
          <button onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', 'H1'); }} className="p-1 hover:bg-[#F0EFED] rounded text-[#1A1A1A] font-bold" title="H1">
            <Heading1 size={14} />
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', 'H2'); }} className="p-1 hover:bg-[#F0EFED] rounded text-[#1A1A1A] font-bold" title="H2">
            <Heading2 size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2 border-r border-[#E5E4DE] pr-4">
          <button onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} className="w-5 h-5 flex items-center justify-center font-bold text-[#1A1A1A] hover:bg-[#F0EFED] rounded" title="B">B</button>
          <button onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} className="w-5 h-5 flex items-center justify-center italic font-serif text-[#1A1A1A] hover:bg-[#F0EFED] rounded" title="I">I</button>
        </div>
        <div className="flex items-center gap-1">
          <button onMouseDown={(e) => { e.preventDefault(); execCommand('justifyLeft'); }} className="p-1 hover:bg-[#F0EFED] rounded text-[#1A1A1A]">
            <AlignLeft size={14} />
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); execCommand('justifyCenter'); }} className="p-1 hover:bg-[#F0EFED] rounded text-[#1A1A1A]">
            <AlignCenter size={14} />
          </button>
           <button onMouseDown={(e) => { e.preventDefault(); execCommand('justifyRight'); }} className="p-1 hover:bg-[#F0EFED] rounded text-[#1A1A1A]">
            <AlignRight size={14} />
          </button>
        </div>
      </div>
      
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="flex-1 px-8 py-16 outline-none overflow-y-auto prose max-w-none text-[#1A1A1A]"
        style={{ minHeight: '300px', textIndent: '1.5em' }}
      />
    </div>
  );
}

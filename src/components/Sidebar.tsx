import { FileText, Trash2, Plus, Search, Database } from 'lucide-react';
import type { ReviewFile } from "../types";
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  files: ReviewFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
  onUploadClick: () => void;
}

export default function Sidebar({ files, selectedFileId, onSelectFile, onDeleteFile, onUploadClick }: SidebarProps) {
  return (
    <aside className="w-72 border-r border-zinc-200 bg-white flex flex-col h-full overflow-hidden z-20 shadow-sm">
      <div className="p-6 space-y-6 bg-zinc-50/50 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-amber-600 border border-zinc-200 shadow-sm">
                <Database size={16} />
             </div>
             <div>
                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Library</h2>
                <div className="text-[9px] font-mono text-zinc-400">FILES: {files.length.toString().padStart(3, '0')}</div>
             </div>
          </div>
          <button 
            onClick={onUploadClick}
            className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-500 transition-all border border-zinc-200 bg-white hover:text-zinc-900 active:scale-95 shadow-sm"
            title="Upload File"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="relative group">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search files..."
            className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-3 py-2 text-[10px] font-mono text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all placeholder:text-zinc-300 uppercase tracking-widest shadow-sm"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-white">
        <AnimatePresence mode="popLayout">
          {files.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center"
            >
              <FileText size={32} className="mx-auto mb-4 text-zinc-100" />
              <p className="text-zinc-300 text-[10px] font-mono uppercase tracking-widest leading-relaxed">
                Library Empty
              </p>
            </motion.div>
          ) : (
            files.map((file) => (
              <motion.div
                layout
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => onSelectFile(file.id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                  selectedFileId === file.id 
                    ? 'bg-amber-500/5 border-amber-500/20 shadow-md shadow-amber-900/5' 
                    : 'hover:bg-zinc-50 border-transparent hover:border-zinc-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    selectedFileId === file.id ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-zinc-100 text-zinc-400 group-hover:bg-white group-hover:border group-hover:border-zinc-200 shadow-sm'
                  }`}>
                    <FileText size={18} strokeWidth={selectedFileId === file.id ? 2.5 : 2} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[11px] font-bold truncate tracking-tight transition-colors ${
                      selectedFileId === file.id ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-900'
                    }`}>
                      {file.original_name}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 truncate mt-0.5">
                      {Math.round(file.size_bytes / 1024)} KB // ONLINE
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 pr-1">
                   <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    title="Delete"
                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-zinc-400 rounded-lg transition-all active:scale-90 border border-zinc-200 hover:border-rose-200 bg-white shadow-sm"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-zinc-100 bg-zinc-50/30">
         <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-400">
            <span>Storage Used</span>
            <span className="text-zinc-900 font-bold">{(files.reduce((acc, f) => acc + f.size_bytes, 0) / (1024 * 1024)).toFixed(2)} MB</span>
         </div>
         <div className="w-full h-1 bg-zinc-200/50 rounded-full mt-3 overflow-hidden border border-zinc-100 shadow-inner">
            <div 
              className="h-full bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.3)] transition-all duration-1000" 
              style={{ width: `${Math.min((files.reduce((acc, f) => acc + f.size_bytes, 0) / (100 * 1024 * 1024)) * 100, 100)}%` }}
            />
         </div>
      </div>
    </aside>
  );
}

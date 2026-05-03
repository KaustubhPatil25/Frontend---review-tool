import React, { useCallback, useState } from 'react';
import { Upload, X, AlertCircle, Cpu, ShieldCheck, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  onClose: () => void;
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const validateAndUpload = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload an image or PDF.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) { // 20MB
      setError('File too large. Maximum size is 20MB.');
      return;
    }
    onUpload(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-zinc-900/40">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-xl glass-panel relative border border-zinc-200 shadow-2xl overflow-hidden rounded-3xl"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600/10 rounded-lg flex items-center justify-center border border-amber-600/20 text-amber-600">
               <Cpu size={20} />
            </div>
            <div className="flex flex-col">
               <h3 className="text-sm font-bold tracking-tight text-zinc-900 uppercase italic">Upload File</h3>
               <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">Select a file to upload</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative min-h-[300px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all group
              ${isDragging 
                ? 'border-amber-500 bg-amber-500/[0.03] shadow-[inset_0_0_40px_rgba(245,158,11,0.05)]' 
                : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/10'
              }
            `}
          >
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => e.target.files?.[0] && validateAndUpload(e.target.files[0])}
              accept=".jpg,.jpeg,.png,.webp,.pdf"
            />
            
            <div className="text-center flex flex-col items-center">
              <div className={`
                w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500
                ${isDragging ? 'bg-amber-600 text-white scale-110 rotate-3 shadow-[0_10px_30px_rgba(217,119,6,0.3)]' : 'bg-white border border-zinc-200 text-zinc-400 group-hover:text-zinc-600 group-hover:border-zinc-300 shadow-sm'}
              `}>
                <Upload size={32} strokeWidth={1.5} />
              </div>
              
              <p className="text-sm font-display font-medium text-zinc-900 mb-2 uppercase tracking-widest">
                {isDragging ? "Release to upload" : "Drag & drop files here"}
              </p>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.15em] mb-8">
                or click to browse
              </p>
              
              <div className="flex gap-4 p-3 bg-zinc-50/50 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded border border-zinc-200 shadow-sm">
                   <FileText size={12} className="text-amber-600" />
                   <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-tighter">PDF</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded border border-zinc-200 shadow-sm">
                   <FileText size={12} className="text-zinc-300" />
                   <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-tighter">Images</span>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600"
              >
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-[10px] font-mono uppercase tracking-widest leading-relaxed">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
           <div className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] font-medium">Secure Transfer</span>
           </div>
           <button 
             onClick={onClose}
             className="px-6 py-2 rounded text-[10px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-[0.2em] transition-colors"
           >
             Cancel
           </button>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useRef, useState, useEffect } from 'react';
import type { ReviewFile, ReviewComment } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, MousePointer2, Info, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface FileViewerProps {
  file: ReviewFile;
  comments: ReviewComment[];
  onAddComment: (x: number, y: number) => void;
  onSelectComment: (id: string) => void;
  selectedCommentId: string | null;
}

export default function FileViewer({ file, comments, onAddComment, onSelectComment, selectedCommentId }: FileViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderTasksRef = useRef<any[]>([]);
  const loadingTaskRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.5);
  const [isPdf, setIsPdf] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const isFilePdf = file.mime_type === 'application/pdf';
    setIsPdf(isFilePdf);
    setLoading(true);
    setZoom(0.5);
    setPageCount(1);
    setCurrentPage(1);
    canvasRefs.current = [];

    if (isFilePdf) {
      renderPdf();
    } else {
      renderImage();
    }

    return () => {
      renderTasksRef.current.forEach(t => t?.cancel());
      renderTasksRef.current = [];
      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy();
      }
    };
  }, [file]);

  const renderImage = () => {
    const img = new Image();
    img.src = `/uploads/${file.name}`;
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
      setLoading(false);
    };
  };

  const renderPdf = async () => {
    renderTasksRef.current.forEach(t => t?.cancel());
    renderTasksRef.current = [];
    if (loadingTaskRef.current) {
      loadingTaskRef.current.destroy();
      loadingTaskRef.current = null;
    }

    try {
      const loadingTask = pdfjsLib.getDocument({
        url: `/uploads/${file.name}`,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
      });
      loadingTaskRef.current = loadingTask;

      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      setPageCount(numPages);
      setCurrentPage(1);

      // Get dimensions from first page
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 2 });
      setDimensions({ width: viewport.width, height: viewport.height });

      // Render all pages sequentially
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (loadingTaskRef.current !== loadingTask) return;
        const page = await pdf.getPage(pageNum);
        const vp = page.getViewport({ scale: 2 });
        const canvas = canvasRefs.current[pageNum - 1];
        if (!canvas) continue;
        const context = canvas.getContext('2d');
        if (!context) continue;
        canvas.width = vp.width;
        canvas.height = vp.height;
        const renderTask = page.render({ canvasContext: context, viewport: vp });
        renderTasksRef.current[pageNum - 1] = renderTask;
        try {
          await renderTask.promise;
        } catch (err: any) {
          if (err.name === 'RenderingCancelledException') return;
          throw err;
        }
      }
      setLoading(false);
    } catch (error: any) {
      if (error.name === 'RenderingCancelledException' || error.name === 'WorkerTerminatedException') return;
      console.error('Error rendering PDF:', error);
      setLoading(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    onAddComment(x, y);
  };

  return (
    <div className="flex-1 bg-zinc-100/20 overflow-hidden flex flex-col relative tech-grid group/viewer">
      {/* Viewer Header */}
      <div className="h-12 border-b border-zinc-200 bg-white/80 px-5 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-white border border-zinc-200 rounded shadow-sm">
             <Info size={12} className="text-amber-600" />
             <span className="text-[10px] font-mono font-bold tracking-tight text-zinc-600 truncate max-w-[200px]">
               {file.original_name.toUpperCase()}
             </span>
          </div>
          <div className="text-[9px] font-mono text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/50 uppercase">
            Format: {file.mime_type.split('/')[1]}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isPdf && pageCount > 1 && (
            <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-0.5 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] font-mono text-zinc-600 min-w-[60px] text-center">
                {currentPage} / {pageCount}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="p-0.5 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center p-20 cursor-crosshair">
        <div 
          ref={containerRef}
          onClick={handleCanvasClick}
          className="relative shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out"
          style={{ 
            width: `${dimensions.width}px`, 
            height: `${dimensions.height}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-30">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.3em] font-bold">Loading...</span>
              </div>
            </div>
          )}

          <div className="relative border border-zinc-200 rounded shadow-2xl overflow-hidden bg-white">
            {isPdf ? (
              <div>
                {Array.from({ length: pageCount }, (_, i) => (
                  <canvas
                    key={i}
                    ref={el => { canvasRefs.current[i] = el; }}
                    className={`block max-w-none grayscale-[0.2] contrast-[1.05] ${i + 1 !== currentPage ? 'hidden' : ''}`}
                  />
                ))}
              </div>
            ) : (
              <img 
                src={`/uploads/${file.name}`} 
                alt={file.original_name}
                className="block max-w-none pointer-events-none select-none grayscale-[0.2] contrast-[1.05]"
                style={{ width: dimensions.width, height: dimensions.height }}
              />
            )}
            
            {/* Asset Overlay Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] data-grid-overlay" />
          </div>

          {/* Annotations Layer */}
          <div className="absolute inset-0 pointer-events-none z-20">
            {comments
              .filter(comment => !isPdf || comment.page === currentPage)
              .map((comment) => (
              <motion.button
                key={comment.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectComment(comment.id);
                }}
                className={`
                  absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-black transition-all pointer-events-auto
                  ${selectedCommentId === comment.id 
                    ? 'bg-amber-600 border-white text-white scale-125 z-40 shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                    : comment.status === 'resolved'
                      ? 'bg-zinc-100/90 border-zinc-300 text-zinc-400 opacity-60 grayscale'
                      : 'bg-white/95 border-amber-500 text-amber-600 hover:scale-110 shadow-lg hover:z-30'
                  }
                `}
                style={{ left: `${comment.x_pct * 100}%`, top: `${comment.y_pct * 100}%` }}
              >
                <div className={`absolute -inset-2 rounded-full border border-current opacity-0 group-hover:opacity-10 ${selectedCommentId === comment.id ? 'animate-ping opacity-10' : ''}`} />
                {comments.indexOf(comment) + 1}
              </motion.button>
            ))}

            {/* Target Lock Visualization for Selected Comment */}
            {selectedCommentId && comments.find(c => c.id === selectedCommentId) && (
              <motion.div 
                layoutId="target-lock"
                className="absolute pointer-events-none border border-amber-500/20 z-10"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  left: `${(comments.find(c => c.id === selectedCommentId)!.x_pct * 100)}%`,
                  top: `${(comments.find(c => c.id === selectedCommentId)!.y_pct * 100)}%`,
                }}
                style={{ 
                  width: '100px', 
                  height: '100px', 
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-amber-500" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-amber-500" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-amber-500" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-amber-500" />
                <div className="absolute inset-0 bg-amber-500/[0.03] animate-pulse" />
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {!loading && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 className="absolute bottom-6 left-6 p-3 glass-panel rounded-lg flex items-center gap-3 pointer-events-none shadow-xl border border-zinc-100"
               >
                 <div className="flex animate-pulse">
                    <MousePointer2 size={14} className="text-amber-500" />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Comment Mode</span>
                   <span className="text-[9px] text-zinc-400 font-mono tracking-tighter uppercase mt-0.5">Click anywhere to comment</span>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* HUD Info Bars */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-white/90 backdrop-blur-md border border-zinc-200/60 p-1.5 rounded-2xl shadow-2xl z-30 scale-90 sm:scale-100 font-sans">
         <div className="flex items-center gap-0.5 bg-zinc-50 p-1 rounded-xl border border-zinc-100">
            <button 
              onClick={() => setZoom(z => Math.max(0.2, z - 0.2))}
              className="p-2 hover:text-zinc-900 transition-colors text-zinc-400 hover:bg-white rounded-lg shadow-sm group"
            >
              <ZoomOut size={14} />
            </button>
            <div className="min-w-[50px] text-center font-medium text-[11px] text-zinc-900 tracking-tight">
              {Math.round(zoom * 100)}%
            </div>
            <button 
              onClick={() => setZoom(z => Math.min(4, z + 0.2))}
              className="p-2 hover:text-zinc-900 transition-colors text-zinc-400 hover:bg-white rounded-lg shadow-sm group"
            >
              <ZoomIn size={14} />
            </button>
         </div>

         <div className="h-8 w-px bg-zinc-200/50 mx-4" />

         <div className="flex items-center gap-6 pr-4">
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Resolution</span>
               <span className="text-[10px] font-medium text-zinc-900">{dimensions.width}px × {dimensions.height}px</span>
            </div>
            <button 
              onClick={() => setZoom(0.5)}
              className="px-4 py-2 bg-zinc-900 text-white hover:bg-black transition-all rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-zinc-900/10 active:scale-95"
            >
              Reset
            </button>
         </div>
      </div>
    </div>
  );
}
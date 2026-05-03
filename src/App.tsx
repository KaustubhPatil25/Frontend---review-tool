import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import FileViewer from './components/FileViewer';
import ReviewFeed from './components/ReviewFeed';
import FileUpload from './components/FileUpload';
import { api } from './services/api';
import type { ReviewFile, ReviewComment, ActivityLog, CommentStatus, CurrentUser } from './types';
import { Loader2, Plus, AlertCircle, HardDrive, Cpu, Terminal, ShieldCheck, MessageSquare, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [files, setFiles] = useState<ReviewFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [pendingComment, setPendingComment] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('solarview_session');
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch {
        localStorage.removeItem('solarview_session');
      }
    }
    const hasVisited = localStorage.getItem('solarview_visited');
    if (!hasVisited && !session) {
      setAuthMode('register');
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      let tokenData;
      if (authMode === 'register') {
        tokenData = await api.register(authUsername, authEmail, authPassword);
      } else {
        tokenData = await api.login(authUsername, authPassword);
      }
      const newUser: CurrentUser = {
        username: tokenData.username,
        email: tokenData.email,
        token: tokenData.access_token,
      };
      localStorage.setItem('solarview_session', JSON.stringify(newUser));
      localStorage.setItem('solarview_visited', 'true');
      setUser(newUser);
      setAuthUsername('');
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err.message ?? 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('solarview_session');
    setUser(null);
    setAuthMode('login');
    setFiles([]);
    setComments([]);
    setActivity([]);
    setSelectedFileId(null);
  };

  const fetchFiles = useCallback(async () => {
    try {
      const data = await api.getFiles();
      setFiles(data);
      if (data.length > 0 && !selectedFileId) {
        setSelectedFileId(data[0].id);
      }
    } catch (err) {
      setError('Failed to load project database');
    } finally {
      setLoading(false);
    }
  }, [selectedFileId]);

  const fetchFileDetails = useCallback(async (fileId: string) => {
    try {
      const [commentsData, activityData] = await Promise.all([
        api.getComments(fileId),
        api.getActivity(fileId),
      ]);
      setComments(commentsData);
      setActivity(activityData);
    } catch (err) {
      setError('Telemetry link failed');
    }
  }, []);

  useEffect(() => {
    if (user) fetchFiles();
  }, [user]);

  useEffect(() => {
    if (selectedFileId) {
      fetchFileDetails(selectedFileId);
      setPendingComment(null);
      setSelectedCommentId(null);
    }
  }, [selectedFileId, fetchFileDetails]);

  const handleUpload = async (file: File) => {
    try {
      setLoading(true);
      const newFile = await api.uploadFile(file, user?.username ?? 'anonymous');
      setFiles(prev => [newFile, ...prev]);
      setSelectedFileId(newFile.id);
      setShowUpload(false);
    } catch (err) {
      setError('Buffer overflow: Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      await api.deleteFile(id);
      setFiles(prev => {
        const remaining = prev.filter(f => f.id !== id);
        if (selectedFileId === id) {
          setSelectedFileId(remaining.length > 0 ? remaining[0].id : null);
        }
        return remaining;
      });
    } catch (err) {
      setError('Purge operation failed');
    }
  };

  const handleAddComment = (x: number, y: number) => {
    setPendingComment({ x, y });
    setSelectedCommentId(null);
  };

  const handleSaveComment = async (text: string) => {
    if (!selectedFileId || !pendingComment) return;
    try {
      const newComment = await api.createComment(selectedFileId, {
        x_pct: pendingComment.x / 100,
        y_pct: pendingComment.y / 100,
        content: text,
        author: user?.username ?? 'anonymous',
      });
      setComments(prev => [...prev, newComment]);
      setPendingComment(null);
      setSelectedCommentId(newComment.id);
      fetchFileDetails(selectedFileId);
    } catch (err) {
      setError('Critical: Command commitment failed');
    }
  };

  const handleUpdateStatus = async (commentId: string, status: CommentStatus) => {
    if (!selectedFileId) return;
    try {
      const updated = await api.updateCommentStatus(
        selectedFileId,
        commentId,
        status,
        user?.username ?? 'anonymous'
      );
      setComments(prev => prev.map(c => (c.id === commentId ? updated : c)));
      fetchFileDetails(selectedFileId);
    } catch (err) {
      setError('State transition error');
    }
  };

  const handleAddReply = async (commentId: string, text: string) => {
    if (!selectedFileId) return;
    try {
      await api.addReply(selectedFileId, commentId, text, user?.username ?? 'anonymous');
      fetchFileDetails(selectedFileId);
    } catch (err) {
      setError('Thread sync failed');
    }
  };

  const selectedFile = files.find(f => f.id === selectedFileId);

  // ── Auth Screen ───────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 tech-grid relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-900/5 blur-[120px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl shadow-2xl p-10 relative overflow-hidden z-10"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-600" />

          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-600/20 mb-6 group hover:rotate-12 transition-transform duration-500">
              <Cpu size={32} />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase italic">
              {authMode === 'login' ? 'Login' : 'Register'}
            </h2>
            <p className="text-[10px] text-zinc-400 font-mono tracking-[0.3em] uppercase mt-2">
              {authMode === 'login' ? 'Please sign in to continue' : 'Create your operator account'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Username</label>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                required
                minLength={2}
                placeholder="operator_id"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-inner"
              />
            </div>

            {authMode === 'register' && (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Email Address</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  placeholder="operator@solarview.io"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-inner"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-inner"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                <AlertCircle size={16} className="shrink-0" />
                <span className="text-[10px] font-mono uppercase tracking-widest">{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="group relative w-full bg-zinc-900 hover:bg-black text-white font-bold py-4.5 rounded-xl shadow-lg transition-all active:scale-[0.98] mt-4 overflow-hidden disabled:opacity-60"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative uppercase tracking-widest text-xs italic flex items-center justify-center gap-2">
                {authLoading && <Loader2 size={14} className="animate-spin" />}
                {authMode === 'login' ? 'Login' : 'Create Account'}
              </span>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-100 text-center flex flex-col gap-4">
            <button
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(null); }}
              className="text-[10px] font-extrabold text-zinc-400 hover:text-amber-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              {authMode === 'login' ? (
                <>New operator? <span className="text-amber-600">Register</span></>
              ) : (
                <>Existing operator? <span className="text-amber-600">Login</span></>
              )}
            </button>
          </div>
        </motion.div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-[0.4em]">SolarView OS // Secure Layer Alpha</p>
          <div className="flex items-center gap-2">
            <ShieldCheck size={10} className="text-emerald-500" />
            <span className="text-[8px] font-mono text-emerald-600/50 uppercase tracking-tighter">AES-256 Encryption Active</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading && files.length === 0) {
    return (
      <div className="h-screen bg-zinc-50 flex flex-col items-center justify-center gap-6 tech-grid">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin" strokeWidth={1.5} />
          <div className="absolute inset-0 bg-amber-600/10 blur-xl animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-zinc-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Initializing Solar Core...</div>
          <div className="w-48 h-1 bg-zinc-200 overflow-hidden rounded-full border border-zinc-300">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-full h-full bg-amber-600 shadow-[0_0_10px_#d97706]"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-50 text-zinc-600 flex flex-col overflow-hidden font-sans selection:bg-amber-500/10">
      {/* Header */}
      <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 z-30">
        <div className="flex items-center gap-10">
          <button
            onClick={() => setSelectedFileId(null)}
            className="flex items-center gap-4 cursor-pointer group hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-amber-600/10 group-hover:scale-105 transition-transform duration-300">
              <Cpu size={20} />
            </div>
            <div className="flex flex-col leading-tight text-left">
              <h1 className="text-sm font-black tracking-tight text-zinc-900 uppercase italic">SolarView</h1>
              <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-[0.2em]">Operator Console</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-tighter leading-none mb-0.5">Kernel</span>
                <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Active</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 border-l border-zinc-200 pl-8">
              <Terminal size={12} className="text-amber-500/50" />
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-tighter leading-none mb-0.5">Auth_Level</span>
                <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Administrator</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={(e) => { e.preventDefault(); handleLogout(); }}
            title="Logout"
            className="flex items-center gap-3 pl-4 border-l border-zinc-100 group cursor-pointer hover:bg-zinc-50/50 transition-all rounded-r-xl py-1 pr-1 active:scale-95 outline-none"
          >
            <div className="hidden sm:flex flex-col items-end pointer-events-none select-none">
              <div className="text-[10px] font-black text-zinc-900 uppercase tracking-tight group-hover:text-amber-600 transition-colors">
                {user.username}
              </div>
              <div className="text-[9px] text-zinc-400 font-mono uppercase tracking-tighter">System Operator</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-500 shadow-sm ring-4 ring-zinc-50/50 group-hover:ring-amber-500/10 transition-all select-none overflow-hidden relative">
              <span className="group-hover:opacity-0 transition-opacity uppercase">{user.username?.substring(0, 2).toUpperCase() ?? "U"}</span>
              <div className="absolute inset-0 bg-zinc-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <LogOut size={14} strokeWidth={2.5} />
              </div>
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full transition-colors" />
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar
          files={files}
          selectedFileId={selectedFileId}
          onSelectFile={setSelectedFileId}
          onDeleteFile={handleDeleteFile}
          onUploadClick={() => setShowUpload(true)}
        />

        {selectedFile ? (
          <div className="flex-1 flex overflow-hidden relative">
            <FileViewer
              file={selectedFile}
              comments={comments}
              onAddComment={handleAddComment}
              onSelectComment={setSelectedCommentId}
              selectedCommentId={selectedCommentId}
            />

            <ReviewFeed
              comments={comments}
              activity={activity}
              selectedCommentId={selectedCommentId}
              onSelectComment={setSelectedCommentId}
              onUpdateStatus={handleUpdateStatus}
              onAddReply={handleAddReply}
              pendingComment={pendingComment}
              onSaveComment={handleSaveComment}
              onCancelComment={() => setPendingComment(null)}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-8 lg:p-16 overflow-y-auto bg-zinc-50 tech-grid">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto w-full space-y-20"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-zinc-200 pb-12">
                <div className="space-y-4">
                  <h2 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase italic leading-none">Command Center</h2>
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    Session_Active // Waiting for Drawing_Input
                  </p>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">Latency</div>
                    <div className="text-xl font-black text-zinc-900 tracking-tighter">04<span className="text-amber-500 opacity-50">MS</span></div>
                  </div>
                  <div className="w-px h-10 bg-zinc-200" />
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">System_Load</div>
                    <div className="text-xl font-black text-zinc-900 tracking-tighter">0.02<span className="text-zinc-300">%</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'Project Health', value: '100%', status: 'OPTIMAL', icon: ShieldCheck, color: 'text-emerald-600' },
                  { title: 'Active Assets', value: files.length.toString().padStart(2, '0'), status: 'INDEXED', icon: HardDrive, color: 'text-amber-600' },
                  { title: 'Open Issues', value: comments.filter(c => c.status !== 'resolved').length.toString().padStart(2, '0'), status: 'PENDING', icon: MessageSquare, color: 'text-orange-600' }
                ].map((stat, i) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className="p-8 tech-card rounded-2xl group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <stat.icon size={64} strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] mb-6">{stat.title}</div>
                      <div className="flex items-end gap-3 mb-2">
                        <div className="text-5xl font-black text-zinc-900 tracking-tighter leading-none">{stat.value}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${stat.color}`}>{stat.status}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 pt-4">
                <div className="lg:col-span-3 space-y-8">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 border-l-2 border-amber-600 pl-4">Operational_Modules</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button
                      onClick={() => setShowUpload(true)}
                      className="group relative h-56 bg-white border border-zinc-200 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all duration-500 text-left p-8 shadow-xl hover:shadow-amber-500/5"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity translate-x-4 group-hover:translate-x-0 transform duration-500">
                        <Plus size={100} strokeWidth={1} />
                      </div>
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-amber-500/10 group-hover:scale-110 transition-transform">
                          <Plus size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-zinc-900 mb-2 uppercase italic tracking-tight">Initialize_Asset</h4>
                          <p className="text-[11px] text-zinc-500 uppercase tracking-wider leading-relaxed pr-8">Mount high-fidelity engineering drawings or technical specifications into the review core for analysis.</p>
                        </div>
                      </div>
                    </button>

                    <button className="group relative h-56 bg-zinc-100/40 border border-zinc-200 rounded-3xl overflow-hidden text-left p-8 opacity-40 cursor-not-allowed grayscale">
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="w-12 h-12 bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-300">
                          <AlertCircle size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-zinc-400 mb-2 uppercase italic tracking-tight">Collaborate_Sync</h4>
                          <p className="text-[11px] text-zinc-400 uppercase tracking-wider leading-relaxed pr-8">Establish a multi-user real-time review session for synchronous coordination with external teams.</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 border-l-2 border-zinc-200 pl-4">System_Telemetry</h3>
                  <div className="space-y-6">
                    {[
                      { type: 'INITIALIZATION', msg: 'SolarView OS loaded successfully', time: 'T-ZERO' },
                      { type: 'NETWORK', msg: 'Telemetry link secured via TLS 1.3', time: 'T+02' },
                      { type: 'DATABASE', msg: 'Local drawing store synchronized', time: 'T+14' },
                      { type: 'SECURITY', msg: 'Kernel isolation: ACTIVE', time: 'T+42' }
                    ].map((log, i) => (
                      <div key={i} className="flex flex-col gap-1 group cursor-default">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-amber-600 transition-colors">{log.type}</span>
                          <span className="text-[8px] font-mono text-zinc-400 uppercase">{log.time}</span>
                        </div>
                        <div className="text-[11px] text-zinc-600 font-sans tracking-tight border-b border-zinc-100 pb-3">{log.msg}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white border border-red-100 text-red-600 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[320px]"
          >
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <AlertCircle size={18} />
            </div>
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest">SysErr_Log</span>
              <span className="text-xs font-bold font-sans text-zinc-900">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-50 rounded transition-colors text-red-400 hover:text-red-600">
              <Plus size={16} className="rotate-45" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpload && <FileUpload onUpload={handleUpload} onClose={() => setShowUpload(false)} />}
      </AnimatePresence>

      {/* HUD Accents */}
      <div className="pointer-events-none fixed top-0 left-0 w-2 h-screen bg-gradient-to-r from-amber-500/[0.03] to-transparent z-[100]" />
      <div className="pointer-events-none fixed top-0 right-0 w-2 h-screen bg-gradient-to-l from-amber-500/[0.03] to-transparent z-[100]" />
    </div>
  );
}

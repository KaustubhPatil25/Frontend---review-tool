import { useState } from 'react';
import { MessageSquare, History, CheckCircle2, Send, Hash, MoreHorizontal } from 'lucide-react';
import  type { ReviewComment, CommentStatus, ActivityLog } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { getAvatarColor, getInitials } from '../lib/utils';

interface ReviewFeedProps {
  comments: ReviewComment[];
  activity: ActivityLog[];
  selectedCommentId: string | null;
  onSelectComment: (id: string) => void;
  onUpdateStatus: (id: string, status: CommentStatus) => void;
  onAddReply: (id: string, text: string) => void;
  pendingComment: { x: number; y: number } | null;
  onSaveComment: (text: string) => void;
  onCancelComment: () => void;
}

const Avatar = ({ name, size = 'sm' }: { name: string, size?: 'sm' | 'md' | 'xs' }) => {
  const sizeClasses = {
    xs: 'w-4 h-4 text-[7px]',
    sm: 'w-6 h-6 text-[9px]',
    md: 'w-8 h-8 text-[11px]'
  };
  
  return (
    <div className={`shrink-0 rounded-full flex items-center justify-center font-bold text-white avatar-ring ${sizeClasses[size]} ${getAvatarColor(name)}`}>
      {getInitials(name)}
    </div>
  );
};
export default function ReviewFeed({ 
  comments, 
  activity, 
  selectedCommentId, 
  onSelectComment, 
  onUpdateStatus, 
  onAddReply,
  pendingComment,
  onSaveComment,
  onCancelComment
}: ReviewFeedProps) {
  const [activeTab, setActiveTab] = useState<'discussions' | 'activity'>('discussions');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [newCommentText, setNewCommentText] = useState('');

  const handleReplySubmit = (commentId: string) => {
    if (!replyText[commentId]?.trim()) return;
    onAddReply(commentId, replyText[commentId]);
    setReplyText({ ...replyText, [commentId]: '' });
  };

  return (
    <aside className="w-80 border-l border-zinc-200 bg-white/50 flex flex-col h-full overflow-hidden z-10 backdrop-blur-sm">
      <div className="p-4 bg-zinc-50/50 border-b border-zinc-200/50">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Activity</div>
          <button className="text-zinc-400 hover:text-zinc-600">
            <MoreHorizontal size={14} />
          </button>
        </div>
        
        <div className="flex p-0.5 bg-zinc-100/50 rounded-lg border border-zinc-200/50">
          <button
            onClick={() => setActiveTab('discussions')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded-md transition-all ${
              activeTab === 'discussions' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <MessageSquare size={12} />
            Discussions
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded-md transition-all ${
              activeTab === 'activity' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <History size={12} />
            Log
          </button>
        </div>
      </div>

      {activeTab === 'discussions' && comments.length > 0 && (
        <div className="px-5 py-3 border-b border-zinc-100 flex flex-col gap-2 bg-zinc-50/30">
           <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">Progress</span>
              <span className="text-[9px] font-mono text-amber-600 font-bold">
                {Math.round((comments.filter(c => c.status === 'resolved').length / comments.length) * 100)}%
              </span>
           </div>
           <div className="w-full h-0.5 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(comments.filter(c => c.status === 'resolved').length / comments.length) * 100}%` }}
                className="h-full bg-amber-500"
              />
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'discussions' ? (
          <div className="flex flex-col">
            <AnimatePresence mode="wait">
              {pendingComment && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="m-4 p-4 glass-panel rounded-xl border border-zinc-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name="Operator" size="sm" />
                    <div>
                      <div className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider">Comment</div>
                      <div className="text-[8px] text-zinc-400 font-mono tracking-tighter uppercase mt-0.5">Draft</div>
                    </div>
                  </div>
                                    <textarea
                    autoFocus
                    placeholder="Type your comment..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-[11px] text-zinc-700 focus:outline-none focus:border-amber-500/30 transition-all resize-none min-h-[100px] leading-relaxed shadow-inner"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                  />
                  
                  <div className="flex justify-end gap-3 mt-4">
                    <button 
                      onClick={onCancelComment}
                      className="px-3 py-1.5 text-[9px] text-zinc-400 hover:text-zinc-600 font-bold uppercase tracking-widest"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={() => {
                        onSaveComment(newCommentText);
                        setNewCommentText('');
                      }}
                      disabled={!newCommentText.trim()}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] transition-all shadow-lg shadow-amber-600/10"
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col">
              {comments.slice().reverse().map((comment) => (
                <div
                  key={comment.id}
                  ref={(el) => {
                     if (selectedCommentId === comment.id) el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  onClick={() => onSelectComment(comment.id)}
                  className={`group relative p-6 transition-all cursor-pointer border-b border-zinc-100 ${
                    selectedCommentId === comment.id 
                      ? 'bg-amber-500/[0.03]' 
                      : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={comment.author} />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-zinc-900 tracking-tight">{comment.author}</span>
                        <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-tighter">
                          {format(new Date(comment.created_at), 'dd MMM / p')}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(comment.id, comment.status === 'resolved' ? 'open' : 'resolved');
                      }}
                      className={`p-1.5 rounded-full transition-all border shadow-sm ${
                        comment.status === 'resolved' 
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20' 
                          : 'bg-white text-zinc-400 hover:text-zinc-600 border-zinc-200'
                      }`}
                    >
                      <CheckCircle2 size={12} />
                    </button>
                  </div>

                  <p className={`text-[11px] leading-relaxed mb-4 ${comment.status === 'resolved' ? 'text-zinc-300 line-through' : 'text-zinc-600 font-medium'}`}>
                    {comment.content}
                  </p>

                  {/* Threaded Replies */}
                  {comment.threads && comment.threads.length > 0 && (
                    <div className="space-y-4 pl-3 border-l border-zinc-100 my-6">
                      {comment.threads.map((reply) => (
                        <div key={reply.id} className="flex gap-3 items-start">
                          <Avatar name={reply.author} size="xs" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-zinc-600">{reply.author}</span>
                              <span className="text-[8px] font-mono text-zinc-300">{format(new Date(reply.created_at), 'p')}</span>
                            </div>
                            <p className="text-zinc-500 text-[10px] leading-relaxed">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Compact Reply Form */}
                  <div 
                    className="mt-4 flex gap-2" 
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      placeholder="Add insight..."
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-[10px] text-zinc-600 focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-300 shadow-inner"
                      value={replyText[comment.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(comment.id)}
                    />
                    <button 
                      onClick={() => handleReplySubmit(comment.id)}
                      disabled={!replyText[comment.id]?.trim()}
                      className="p-2 text-zinc-400 hover:text-amber-600 disabled:opacity-30 transition-all bg-white border border-zinc-200 rounded shadow-sm"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {comments.length === 0 && !pendingComment && (
              <div className="p-12 text-center h-full min-h-[400px] flex flex-col items-center justify-center">
                 <div className="w-10 h-10 border border-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-200">
                    <Hash size={16} />
                 </div>
                 <p className="text-zinc-300 text-[9px] font-mono uppercase tracking-[0.3em]">
                   No comments yet
                 </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {activity.map((item, idx) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex gap-4 relative"
              >
                <div className="shrink-0 relative z-10">
                   <Avatar name={item.actor} size="sm" />
                   <div className="absolute top-7 bottom-[-32px] left-3 w-px bg-zinc-100 last:hidden" />
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">{item.actor}</span>
                    <span className="text-[8px] font-mono text-zinc-400 font-medium tracking-tighter">
                      {format(new Date(item.created_at), 'HH:mm:ss')}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-[10px] text-zinc-500 font-sans leading-relaxed shadow-sm">
                    {item.action === 'file_uploaded' && `Uploaded file [${item.meta?.name ?? ''}]`}
                    {item.action === 'comment_created' && 'Added a new comment'}
                    {item.action === 'reply_added' && 'Replied to a comment'}
                    {item.action === 'status_changed' && `Changed status to ${item.meta?.to ?? ''}`}
                    {!['file_uploaded','comment_created','reply_added','status_changed'].includes(item.action) && item.action.replace(/_/g, ' ')}
                  </div>
                </div>
              </motion.div>
            ))}
            {activity.length === 0 && (
              <div className="p-12 text-center text-zinc-300 text-[9px] font-mono uppercase tracking-widest">
                No activity yet
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

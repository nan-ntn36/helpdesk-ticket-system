import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTicketDetail, useComments, useCreateComment, useUpdateTicketStatus, useAssignTicket, useUsers } from '@/api/hooks';
import { useAppSelector } from '@/app/hooks';
import { selectUserRole, selectUser } from '@/features/auth/authSelectors';
import { ArrowLeft, Clock, Send, User, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeSocket, getSocket } from '@/lib/socket';
import styles from './TicketDetailPage.module.css';

export function TicketDetailPage() {
  const { id } = useParams();
  const ticketId = parseInt(id!);
  const navigate = useNavigate();
  const role = useAppSelector(selectUserRole);
  const currentUser = useAppSelector(selectUser);
  const qc = useQueryClient();

  const { data, isLoading } = useTicketDetail(ticketId);
  const { data: commentsData } = useComments(ticketId);
  const { data: usersData } = useUsers(1, 100);
  const createComment = useCreateComment(ticketId);
  const updateStatus = useUpdateTicketStatus();
  const assignTicket = useAssignTicket();

  const [comment, setComment] = useState('');
  const ticket = data?.data;
  const comments = commentsData?.data ?? [];

  // Real-time comments via Socket.IO
  useEffect(() => {
    if (!ticketId) return;

    const unsubscribe = subscribeSocket((socket, on) => {
      socket.emit('join-ticket', ticketId);

      const handleNewComment = () => {
        qc.invalidateQueries({ queryKey: ['comments', ticketId] });
        qc.invalidateQueries({ queryKey: ['tickets', ticketId] });
      };

      const handleTicketUpdated = () => {
        qc.invalidateQueries({ queryKey: ['tickets'] });
        qc.invalidateQueries({ queryKey: ['tickets', ticketId] });
      };

      handleTicketUpdated();
      on('ticket:new-comment', handleNewComment);
      on('ticket:list-updated', handleTicketUpdated);
    });

    return () => {
      getSocket()?.emit('leave-ticket', ticketId);
      unsubscribe();
    };
  }, [ticketId, qc]);

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    createComment.mutate(comment, { onSuccess: () => setComment('') });
  };

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({ id: ticketId, status: newStatus });
  };

  const handleAssign = (userId: string) => {
    assignTicket.mutate({ id: ticketId, assignedToId: userId ? parseInt(userId) : null });
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa ticket này? Hành động này không thể hoàn tác.')) return;
    try {
      const { ticketApi } = await import('@/api/endpoints');
      await ticketApi.delete(ticketId);
      qc.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/app/tickets', { replace: true });
    } catch (err) {
      alert('Xóa ticket thất bại');
    }
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto' }} /></div>;
  if (!ticket) return <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Ticket not found</div>;

  return (
    <div className="animate-fadeIn">
      <Link to="/app/tickets" className={styles.backLink}><ArrowLeft size={16} /> Back to Tickets</Link>

      <div className={styles.layout}>
        {/* Main Content */}
        <div className={styles.mainCol}>
          <div className="card">
            <div className={styles.ticketHeader}>
              <span className={styles.ticketId}>#{ticket.id}</span>
              <span className={`badge badge-${ticket.status.toLowerCase().replace('_', '-')}`}>{ticket.status.replace('_', ' ')}</span>
              <span className={`badge badge-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
            </div>
            <h1 className={styles.ticketTitle}>{ticket.title}</h1>
            <p className={styles.ticketDesc}>{ticket.description}</p>
            <div className={styles.ticketMeta}>
              <span><User size={14} /> {ticket.createdBy?.fullName}</span>
              <span><Clock size={14} /> {new Date(ticket.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              {ticket.category && <span>📁 {ticket.category.name}</span>}
            </div>
          </div>

          {/* Comments */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h2 className={styles.sectionTitle}>Comments ({comments.length})</h2>
            <div className={styles.commentList}>
              {comments.map((c: any) => (
                <div key={c.id} className={`${styles.commentItem} ${c.user?.id === currentUser?.id ? styles.ownComment : ''}`}>
                  <div className={styles.commentAvatar}>{c.user?.fullName?.charAt(0)}</div>
                  <div className={styles.commentBody}>
                    <div className={styles.commentHeader}>
                      <strong>{c.user?.fullName}</strong>
                      <span className={styles.commentTime}>{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className={styles.commentContent}>{c.content}</p>
                  </div>
                </div>
              ))}
              {!comments.length && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No comments yet</p>}
            </div>

            <form onSubmit={handleComment} className={styles.commentForm}>
              <input className="form-input" placeholder="Write a comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={!comment.trim() || createComment.isPending}><Send size={16} /></button>
            </form>
          </div>

          {/* History */}
          {ticket.histories?.length > 0 && (
            <div className="card" style={{ marginTop: '16px' }}>
              <h2 className={styles.sectionTitle}>History</h2>
              <div className={styles.historyList}>
                {ticket.histories.map((h: any) => (
                  <div key={h.id} className={styles.historyItem}>
                    <div className={styles.historyDot} />
                    <div>
                      <strong>{h.user?.fullName}</strong> changed <code>{h.field}</code> from {' '}
                      <span className={styles.oldValue}>{h.oldValue || 'null'}</span> → <span className={styles.newValue}>{h.newValue || 'null'}</span>
                      <span className={styles.historyTime}>{new Date(h.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {(role === 'ADMIN' || role === 'AGENT') && (
          <div className={styles.sideCol}>
            <div className="card">
              <h3 className={styles.sideTitle}>Actions</h3>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Status</label>
                <select className="form-select" value={ticket.status} onChange={(e) => handleStatusChange(e.target.value)}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {role === 'ADMIN' && (
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="form-select" value={ticket.assignedToId ?? ''} onChange={(e) => handleAssign(e.target.value)}>
                    <option value="">Unassigned</option>
                    {usersData?.data?.filter((u: any) => u.role?.name !== 'USER').map((u: any) => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.role?.name})</option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'ADMIN' && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleDelete}>
                    <Trash2 size={14} /> Xóa Ticket
                  </button>
                </div>
              )}
            </div>

            <div className="card" style={{ marginTop: '12px' }}>
              <h3 className={styles.sideTitle}>Details</h3>
              <div className={styles.detailRow}><span>Assigned</span><span>{ticket.assignedTo?.fullName || 'Unassigned'}</span></div>
              <div className={styles.detailRow}><span>Category</span><span>{ticket.category?.name || '—'}</span></div>
              <div className={styles.detailRow}><span>Created</span><span>{new Date(ticket.createdAt).toLocaleDateString('vi-VN')}</span></div>
              <div className={styles.detailRow}><span>Updated</span><span>{new Date(ticket.updatedAt).toLocaleDateString('vi-VN')}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

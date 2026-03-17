import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTickets, useCategories } from '@/api/hooks';
import { useAppSelector } from '@/app/hooks';
import { selectUserRole } from '@/features/auth/authSelectors';
import { Plus, Search, Filter } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import styles from './TicketsPage.module.css';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function TicketsPage() {
  const role = useAppSelector(selectUserRole);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading } = useTickets({
    page,
    limit: 10,
    status: status || undefined,
    priority: priority || undefined,
    search: debouncedSearch || undefined,
  });
  useCategories(); // preload for filter
  const tickets = data?.data ?? [];
  const pagination = data?.pagination;

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, status, priority]);

  // Real-time: refresh ticket list when any ticket is created/updated/deleted
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setup = () => {
      const socket = getSocket();
      if (!socket) return false;

      const refresh = () => {
        console.log('[TicketsPage] ticket:list-updated received, refreshing...');
        qc.invalidateQueries({ queryKey: ['tickets'] });
      };
      socket.on('ticket:list-updated', refresh);
      cleanup = () => socket.off('ticket:list-updated', refresh);
      return true;
    };

    // Try immediately, if socket not ready, retry every 2s
    if (!setup()) {
      const interval = setInterval(() => {
        if (setup()) clearInterval(interval);
      }, 2000);
      return () => { clearInterval(interval); cleanup?.(); };
    }

    return () => { cleanup?.(); };
  }, [qc]);

  return (
    <div className="animate-fadeIn">
      <div className={styles.header}>
        <h1 className={styles.title}>Tickets</h1>
        <Link to="/app/tickets/new" className="btn btn-primary"><Plus size={18} /> New Ticket</Link>
      </div>

      {/* Filters */}
      <div className={`card ${styles.filters}`}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            className="form-input"
            placeholder="Search tickets by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>
        <div className={styles.filterGroup}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); }} style={{ width: 'auto' }}>
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select className="form-select" value={priority} onChange={(e) => { setPriority(e.target.value); }} style={{ width: 'auto' }}>
            <option value="">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto' }} /></div>
      ) : tickets.length ? (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Category</th>
                  {(role === 'ADMIN' || role === 'AGENT') && <th>Created By</th>}
                  <th>Assigned To</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t: any) => (
                  <tr key={t.id}>
                    <td><Link to={`/app/tickets/${t.id}`}>#{t.id}</Link></td>
                    <td><Link to={`/app/tickets/${t.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.title}</Link></td>
                    <td><span className={`badge badge-${t.status.toLowerCase().replace('_', '-')}`}>{t.status.replace('_', ' ')}</span></td>
                    <td><span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.category?.name ?? '—'}</td>
                    {(role === 'ADMIN' || role === 'AGENT') && <td>{t.createdBy?.fullName}</td>}
                    <td>{t.assignedTo?.fullName || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td>{t._count?.comments ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className={styles.paginationWrap}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} tickets)
              </span>
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>No tickets found.</p>
          <Link to="/app/tickets/new" className="btn btn-primary" style={{ marginTop: '1rem' }}><Plus size={16} /> Create First Ticket</Link>
        </div>
      )}
    </div>
  );
}

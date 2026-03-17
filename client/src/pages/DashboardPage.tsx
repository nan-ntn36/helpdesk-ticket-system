import { useDashboardStats } from '@/api/hooks';
import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/features/auth/authSelectors';
import { Ticket, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const user = useAppSelector(selectUser);
  const { data, isLoading } = useDashboardStats();
  const stats = data?.data;

  if (isLoading) {
    return <div className={styles.loading}><div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} /></div>;
  }

  const cards = [
    { label: 'Total Tickets', value: stats?.counts?.total ?? 0, icon: Ticket, color: 'var(--accent)' },
    { label: 'Open', value: stats?.counts?.open ?? 0, icon: Clock, color: 'var(--status-open)' },
    { label: 'In Progress', value: stats?.counts?.inProgress ?? 0, icon: TrendingUp, color: 'var(--status-progress)' },
    { label: 'Resolved', value: stats?.counts?.resolved ?? 0, icon: CheckCircle, color: 'var(--status-resolved)' },
    { label: 'Closed', value: stats?.counts?.closed ?? 0, icon: XCircle, color: 'var(--status-closed)' },
    { label: 'Urgent', value: stats?.counts?.urgent ?? 0, icon: AlertTriangle, color: 'var(--priority-urgent)' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.greeting}>Welcome back, {user?.fullName}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} className={`card ${styles.statCard}`}>
            <div>
              <p className={styles.statLabel}>{card.label}</p>
              <p className={styles.statValue}>{card.value}</p>
            </div>
            <div className={styles.statIcon} style={{ background: `${card.color}15`, color: card.color }}>
              <card.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tickets */}
      <div className={`card ${styles.recentSection}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Tickets</h2>
          <Link to="/app/tickets" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        {stats?.recentTickets?.length ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created By</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTickets.map((t: any) => (
                  <tr key={t.id}>
                    <td><Link to={`/app/tickets/${t.id}`}>#{t.id}</Link></td>
                    <td><Link to={`/app/tickets/${t.id}`}>{t.title}</Link></td>
                    <td><span className={`badge badge-${t.status.toLowerCase().replace('_', '-')}`}>{t.status}</span></td>
                    <td><span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                    <td>{t.createdBy?.fullName}</td>
                    <td>{t.assignedTo?.fullName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No tickets yet</p>
        )}
      </div>
    </div>
  );
}

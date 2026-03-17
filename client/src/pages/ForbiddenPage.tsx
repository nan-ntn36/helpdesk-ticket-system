import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#e2e8f0',
      background: '#0f172a',
    }}>
      <h1 style={{ fontSize: '6rem', margin: 0, color: '#f43f5e' }}>403</h1>
      <p style={{ fontSize: '1.25rem', color: '#94a3b8' }}>
        You don't have permission to access this page.
      </p>
      <Link
        to="/app/dashboard"
        style={{
          marginTop: '1.5rem',
          padding: '0.75rem 1.5rem',
          background: '#6366f1',
          color: '#fff',
          borderRadius: '0.5rem',
          textDecoration: 'none',
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

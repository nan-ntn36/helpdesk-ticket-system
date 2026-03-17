import { Link } from 'react-router-dom';

export function NotFoundPage() {
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
      <h1 style={{ fontSize: '6rem', margin: 0, color: '#6366f1' }}>404</h1>
      <p style={{ fontSize: '1.25rem', color: '#94a3b8' }}>
        Page not found.
      </p>
      <Link
        to="/"
        style={{
          marginTop: '1.5rem',
          padding: '0.75rem 1.5rem',
          background: '#6366f1',
          color: '#fff',
          borderRadius: '0.5rem',
          textDecoration: 'none',
        }}
      >
        Go Home
      </Link>
    </div>
  );
}

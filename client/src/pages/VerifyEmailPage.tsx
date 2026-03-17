import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '@/api/axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token');
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        setMessage('Email đã được xác nhận thành công!');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      });
  }, [params]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#09090b', color: '#fafafa',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div className="card" style={{ maxWidth: 400, textAlign: 'center', padding: '2rem' }}>
        {status === 'loading' && (
          <>
            <Loader size={40} className="animate-spin" style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            <p style={{ color: '#a1a1aa' }}>Đang xác minh email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            <h2 style={{ margin: '0 0 0.5rem' }}>{message}</h2>
            <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>Bạn có thể đăng nhập ngay bây giờ</p>
            <Link to="/auth/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              Đăng Nhập
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
            <h2 style={{ margin: '0 0 0.5rem', color: '#ef4444' }}>Xác minh thất bại</h2>
            <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>{message}</p>
            <Link to="/auth/login" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
              Quay về đăng nhập
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

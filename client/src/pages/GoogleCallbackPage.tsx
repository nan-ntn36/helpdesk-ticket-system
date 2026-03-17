import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { fetchMeThunk } from '@/features/auth/authThunks';
import { setAccessToken } from '@/features/auth/authSlice';
import { connectSocket } from '@/lib/socket';

export function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      dispatch(setAccessToken(token));
      connectSocket(token);
      dispatch(fetchMeThunk()).then(() => {
        navigate('/app/dashboard', { replace: true });
      });
    } else {
      navigate('/auth/login', { replace: true });
    }
  }, [params, navigate, dispatch]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#09090b', color: '#fafafa',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #27272a', borderTopColor: '#10b981',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
        }} />
        <p style={{ color: '#a1a1aa' }}>Đang xử lý đăng nhập Google...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

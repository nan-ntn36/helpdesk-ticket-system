import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectIsInitializing } from '@/features/auth/authSelectors';
import { refreshTokenThunk, fetchMeThunk } from '@/features/auth/authThunks';
import { setupInterceptors } from '@/api/axios';
import { store } from '@/app/store';
import { router } from '@/app/router';
import { connectSocket } from '@/lib/socket';

// Setup Axios interceptors with store reference
setupInterceptors(() => store);

function App() {
  const dispatch = useAppDispatch();
  const isInitializing = useAppSelector(selectIsInitializing);

  useEffect(() => {
    // On app load: try to refresh token (cookie still valid?)
    dispatch(refreshTokenThunk())
      .then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          // Token refreshed → fetch user profile & connect socket
          dispatch(fetchMeThunk());
          const token = (result.payload as any)?.accessToken;
          if (token) connectSocket(token);
        }
      });
  }, [dispatch]);

  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#09090b',
        color: '#fafafa',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #27272a',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: '#a1a1aa' }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;

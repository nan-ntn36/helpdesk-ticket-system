import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TicketCheck, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';
import api from '@/api/axios';
import styles from './LoginPage.module.css';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { fullName, email, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.bgGlow} />
        <div className={styles.card}>
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={48} color="var(--accent)" style={{ marginBottom: 16 }} />
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
              Đăng ký thành công!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
              Vui lòng kiểm tra email <strong style={{ color: 'var(--accent)' }}>{email}</strong> để xác nhận tài khoản trước khi đăng nhập.
            </p>
            <Link
              to="/auth/login"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Về trang đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgGlow} />
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <TicketCheck size={28} />
          </div>
          <h1 className={styles.title}>HelpDesk</h1>
          <p className={styles.subtitle}>Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Họ và tên</label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Mật khẩu</label>
            <div className={styles.passwordWrap}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg ${styles.submitBtn}`}
            disabled={loading || !fullName || !email || !password || !confirmPassword}
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Đang đăng ký...
              </>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>

        <p className={styles.hint}>
          Đã có tài khoản?{' '}
          <Link to="/auth/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectUser, selectUserRole, selectUserPermissions } from '@/features/auth/authSelectors';
import { fetchMeThunk } from '@/features/auth/authThunks';
import { authApi } from '@/api/auth.api';
import { UserCircle, Mail, Shield, Key, Save, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectUserRole);
  const permissions = useAppSelector(selectUserPermissions);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const data: Record<string, string> = {};
      if (fullName !== user?.fullName) data.fullName = fullName;
      if (email !== user?.email) data.email = email;
      if (newPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }

      if (Object.keys(data).length === 0) {
        setFeedback({ type: 'error', message: 'No changes to save' });
        setSaving(false);
        return;
      }

      await authApi.updateProfile(data);
      await dispatch(fetchMeThunk());
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setEditing(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to update profile';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Profile</h1>
        {!editing && (
          <button className="btn btn-secondary" onClick={() => { setEditing(true); setFeedback(null); }}>
            Edit Profile
          </button>
        )}
      </div>

      {feedback && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', marginBottom: 16, borderRadius: 'var(--radius-md)',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: feedback.type === 'success' ? 'var(--success)' : 'var(--error)',
          fontSize: '0.85rem',
        }}>
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      {!editing ? (
        /* View Mode */
        <div className="card" style={{ maxWidth: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--accent)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 700,
            }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{user?.fullName}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{role}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-secondary)' }}>
              <UserCircle size={18} /> <span>ID: {user?.id}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-secondary)' }}>
              <Mail size={18} /> <span>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-secondary)' }}>
              <Shield size={18} /> <span>Role: <strong style={{ color: 'var(--accent)' }}>{role}</strong></span>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-primary)' }}>
              <Key size={16} /> <strong>Permissions ({permissions.length})</strong>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {permissions.map(p => (
                <span key={p} className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '0.7rem' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <form onSubmit={handleSave} className="card" style={{ maxWidth: 500 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="editEmail">Email</label>
              <input
                id="editEmail"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} /> Change Password (optional)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Required to change password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setEditing(false);
                setFullName(user?.fullName ?? '');
                setEmail(user?.email ?? '');
                setCurrentPassword('');
                setNewPassword('');
                setFeedback(null);
              }}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

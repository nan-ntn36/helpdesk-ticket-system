import { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useRoles } from '@/api/hooks';
import { UserPlus, X, Edit2, Shield, Power } from 'lucide-react';
import styles from './UsersPage.module.css';

export function UsersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsers(page);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: rolesData } = useRoles();
  const roles = rolesData?.data ?? [];
  const users = data?.data ?? [];
  const pagination = data?.pagination;

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', roleId: '' });

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ fullName: '', roleId: '', isActive: true });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { ...createForm, roleId: parseInt(createForm.roleId) },
      { onSuccess: () => { setShowCreate(false); setCreateForm({ fullName: '', email: '', password: '', roleId: '3' }); } }
    );
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      fullName: user.fullName,
      roleId: String(user.role?.id ?? user.roleId),
      isActive: user.isActive,
    });
    setShowEdit(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    updateUser.mutate(
      { id: editUser.id, data: { fullName: editForm.fullName, roleId: parseInt(editForm.roleId), isActive: editForm.isActive } },
      { onSuccess: () => setShowEdit(false) }
    );
  };

  const handleToggleActive = (user: any) => {
    if (!confirm(`${user.isActive ? 'Vô hiệu hoá' : 'Kích hoạt'} user "${user.fullName}"?`)) return;
    updateUser.mutate({ id: user.id, data: { isActive: !user.isActive } });
  };

  return (
    <div className="animate-fadeIn">
      <div className={styles.header}>
        <h1 className={styles.title}>Users Management</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><UserPlus size={18} /> Add User</button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto' }} /></div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td><span className={`badge ${u.role?.name === 'ADMIN' ? 'badge-urgent' : u.role?.name === 'AGENT' ? 'badge-medium' : 'badge-closed'}`}>{u.role?.name}</span></td>
                    <td>{u.isActive ? <span style={{ color: 'var(--success)' }}>● Active</span> : <span style={{ color: 'var(--error)' }}>● Inactive</span>}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} title="Edit">
                          <Edit2 size={15} />
                        </button>
                        <button
                          className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-ghost'}`}
                          onClick={() => handleToggleActive(u)}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                          style={{ padding: '4px 8px' }}
                        >
                          <Power size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className={styles.overlay} onClick={() => setShowCreate(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}><UserPlus size={18} /> Add New User</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={createForm.fullName} onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={createForm.roleId} onChange={e => setCreateForm(f => ({ ...f, roleId: e.target.value }))} required>
                  <option value="">-- Chọn role --</option>
                  {roles.map((r: any) => (
                    <option key={r.id} value={String(r.id)}>{r.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={createUser.isPending}>{createUser.isPending ? 'Creating...' : 'Create User'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEdit && editUser && (
        <div className={styles.overlay} onClick={() => setShowEdit(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={18} /> Edit User #{editUser.id}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={editForm.roleId} onChange={e => setEditForm(f => ({ ...f, roleId: e.target.value }))}>
                  {roles.map((r: any) => (
                    <option key={r.id} value={String(r.id)}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${editForm.isActive ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setEditForm(f => ({ ...f, isActive: true }))}
                  >● Active</button>
                  <button
                    type="button"
                    className={`btn btn-sm ${!editForm.isActive ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => setEditForm(f => ({ ...f, isActive: false }))}
                  >● Inactive</button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={updateUser.isPending}>{updateUser.isPending ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useCategories, useCreateCategory } from '@/api/hooks';
import { FolderPlus } from 'lucide-react';

export function CategoriesPage() {
  const { data, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const categories = data?.data ?? [];
  const [name, setName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCategory.mutate(name, { onSuccess: () => setName('') });
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 20px' }}>Categories</h1>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 20, maxWidth: 420 }}>
        <input className="form-input" placeholder="New category name" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1 }} />
        <button type="submit" className="btn btn-primary" disabled={!name.trim() || createCategory.isPending}><FolderPlus size={18} /> Add</button>
      </form>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto' }} /></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th></tr></thead>
            <tbody>
              {categories.map((c: any) => (
                <tr key={c.id}><td>{c.id}</td><td style={{ fontWeight: 500 }}>{c.name}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

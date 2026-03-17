import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTicket, useCategories } from '@/api/hooks';
import { ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CreateTicketPage() {
  const navigate = useNavigate();
  const createTicket = useCreateTicket();
  const { data: catData } = useCategories();
  const categories = catData?.data ?? [];

  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', categoryId: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket.mutate(
      { ...form, categoryId: form.categoryId ? parseInt(form.categoryId) : undefined },
      { onSuccess: (res: any) => navigate(`/app/tickets/${res.data.data.id}`) }
    );
  };

  return (
    <div className="animate-fadeIn">
      <Link to="/app/tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}><ArrowLeft size={16} /> Back</Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 24px' }}>New Ticket</h1>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Title *</label>
            <input id="title" className="form-input" placeholder="Brief description of the issue" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required minLength={3} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description *</label>
            <textarea id="description" className="form-textarea" placeholder="Detailed description of the problem..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required minLength={10} style={{ minHeight: 150 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.categoryId} onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={createTicket.isPending} style={{ alignSelf: 'flex-start' }}>
            <Send size={18} /> {createTicket.isPending ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}

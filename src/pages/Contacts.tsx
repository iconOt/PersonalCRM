import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS } from '../types';

export default function Contacts() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', job_title: '', organization_id: '', status: 'lead' });

  const load = () => api.contacts.list(search, statusFilter).then(setContacts);

  useEffect(() => { load(); }, [search, statusFilter]);
  useEffect(() => { api.organizations.list().then(setOrgs); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, organization_id: form.organization_id || null };
    if (editContact) {
      await api.contacts.update(editContact.id, data);
    } else {
      await api.contacts.create(data);
    }
    setShowModal(false);
    setEditContact(null);
    setForm({ name: '', email: '', phone: '', job_title: '', organization_id: '', status: 'lead' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this contact?')) {
      await api.contacts.delete(id);
      load();
    }
  };

  const openEdit = (c: any) => {
    setEditContact(c);
    setForm({
      name: c.name, email: c.email, phone: c.phone, job_title: c.job_title,
      organization_id: c.organization_id || '', status: c.status
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
        <button
          className="btn-primary"
          onClick={() => { setEditContact(null); setForm({ name: '', email: '', phone: '', job_title: '', organization_id: '', status: 'lead' }); setShowModal(true); }}
        >
          + Add Contact
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search contacts..."
          className="input flex-1 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {CONTACT_STATUSES.map((s) => (
            <option key={s} value={s}>{CONTACT_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Organization</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/contacts/${c.id}`} className="text-sm font-medium text-brand-blue hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{c.email}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{c.organization_name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge badge-${c.status}`}>{CONTACT_STATUS_LABELS[c.status]}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(c)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-blue mr-3">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600">Delete</button>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No contacts found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{editContact ? 'Edit Contact' : 'Add Contact'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <input className="input w-full" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <input className="input w-full" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input className="input w-full" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className="input w-full" placeholder="Job Title" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
                <select className="input w-full" value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })}>
                  <option value="">No Organization</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <select className="input w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {CONTACT_STATUSES.map((s) => <option key={s} value={s}>{CONTACT_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editContact ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DEAL_STAGES, DEAL_STAGE_LABELS } from '../types';
import { ErrorState, InlineError } from '../components/States';

export default function Deals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDeal, setEditDeal] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', organization_id: '', contact_id: '', stage: 'new', value: '', close_date: '' });
  const [error, setError] = useState<unknown>(null);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // `cancelled` discards a response that a newer keystroke has already superseded.
  useEffect(() => {
    let cancelled = false;
    api.deals
      .list(search)
      .then((rows) => {
        if (cancelled) return;
        setDeals(rows);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [search, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    api.organizations.list().then((r) => { if (!cancelled) setOrgs(r); }).catch(() => undefined);
    api.contacts.list().then((r) => { if (!cancelled) setContacts(r); }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    const data = {
      ...form,
      organization_id: form.organization_id || null,
      contact_id: form.contact_id || null,
      value: form.value ? Number(form.value) : 0,
    };
    try {
      if (editDeal) {
        await api.deals.update(editDeal.id, data);
      } else {
        await api.deals.create(data);
      }
      setShowModal(false);
      setEditDeal(null);
      setForm({ name: '', organization_id: '', contact_id: '', stage: 'new', value: '', close_date: '' });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setSaveError(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this deal?')) return;
    setError(null);
    try {
      await api.deals.delete(id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err);
    }
  };

  const openEdit = (d: any) => {
    setEditDeal(d);
    setSaveError(null);
    setForm({
      name: d.name,
      organization_id: d.organization_id || '',
      contact_id: d.contact_id || '',
      stage: d.stage,
      value: String(d.value || ''),
      close_date: d.close_date || '',
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Deals</h1>
        <button
          className="btn-primary"
          onClick={() => { setEditDeal(null); setForm({ name: '', organization_id: '', contact_id: '', stage: 'new', value: '', close_date: '' }); setShowModal(true); }}
        >
          + Add Deal
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search deals..."
          className="input w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => setReloadKey((k) => k + 1)} title="Could not load deals" />
      ) : (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stage</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Close Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Organization</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contact</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/deals/${d.id}`} className="text-sm font-medium text-brand-blue hover:underline">{d.name}</Link>
                </td>
                <td className="px-4 py-3"><span className={`badge badge-${d.stage}`}>{DEAL_STAGE_LABELS[d.stage]}</span></td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">${d.value?.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{d.close_date || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{d.organization_name || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{d.contact_name || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(d)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-blue mr-3">Edit</button>
                  <button onClick={() => handleDelete(d.id)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600">Delete</button>
                </td>
              </tr>
            ))}
            {deals.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No deals found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{editDeal ? 'Edit Deal' : 'Add Deal'}</h2>
            <form onSubmit={handleSubmit}>
              {saveError != null && <div className="mb-3"><InlineError error={saveError} /></div>}
              <div className="space-y-3">
                <input className="input w-full" placeholder="Deal Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <select className="input w-full" value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })}>
                  <option value="">No Organization</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <select className="input w-full" value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })}>
                  <option value="">No Contact</option>
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="input w-full" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                  {DEAL_STAGES.map((s) => <option key={s} value={s}>{DEAL_STAGE_LABELS[s]}</option>)}
                </select>
                <input className="input w-full" type="number" placeholder="Value (USD)" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                <input className="input w-full" type="date" placeholder="Close Date" value={form.close_date} onChange={(e) => setForm({ ...form, close_date: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editDeal ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

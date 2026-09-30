import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorState, InlineError } from '../components/States';

export default function Organizations() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editOrg, setEditOrg] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [form, setForm] = useState({ name: '', website: '', industry: '', notes: '' });
  const [reloadKey, setReloadKey] = useState(0);

  // `cancelled` discards a slow response that a newer keystroke has already superseded,
  // so the table always reflects the term currently in the box.
  useEffect(() => {
    let cancelled = false;
    api.organizations
      .list(search)
      .then((rows) => {
        if (cancelled) return;
        setOrgs(rows);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [search, reloadKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    try {
      if (editOrg) {
        await api.organizations.update(editOrg.id, form);
      } else {
        await api.organizations.create(form);
      }
      setShowModal(false);
      setEditOrg(null);
      setForm({ name: '', website: '', industry: '', notes: '' });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setSaveError(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this organization?')) return;
    setError(null);
    try {
      await api.organizations.delete(id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err);
    }
  };

  const openEdit = (org: any) => {
    setEditOrg(org);
    setSaveError(null);
    setForm({ name: org.name, website: org.website, industry: org.industry, notes: org.notes });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Organizations</h1>
        <button
          className="btn-primary"
          onClick={() => { setEditOrg(null); setForm({ name: '', website: '', industry: '', notes: '' }); setShowModal(true); }}
        >
          + Add Organization
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search organizations..."
          className="input w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => setReloadKey((k) => k + 1)} title="Could not load organizations" />
      ) : (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Industry</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Website</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/organizations/${org.id}`} className="text-sm font-medium text-brand-blue hover:underline">
                    {org.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{org.industry}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{org.website}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(org)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-blue mr-3">Edit</button>
                  <button onClick={() => handleDelete(org.id)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600">Delete</button>
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No organizations found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{editOrg ? 'Edit Organization' : 'Add Organization'}</h2>
            <form onSubmit={handleSubmit}>
              {saveError != null && <div className="mb-3"><InlineError error={saveError} /></div>}
              <div className="space-y-3">
                <input className="input w-full" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <input className="input w-full" placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                <input className="input w-full" placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                <textarea className="input w-full" placeholder="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editOrg ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

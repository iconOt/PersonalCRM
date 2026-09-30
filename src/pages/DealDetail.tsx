import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { DEAL_STAGE_LABELS, ACTIVITY_TYPES } from '../types';

export default function DealDetail() {
  const { id } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: 'note', description: '', due_date: '' });

  const load = () => {
    if (id) api.deals.get(id).then(setDeal);
  };

  useEffect(() => { load(); }, [id]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.activities.create({
      type: activityForm.type,
      deal_id: id,
      contact_id: deal.contact_id,
      description: activityForm.description,
      due_date: activityForm.due_date || null,
    });
    setShowActivityModal(false);
    setActivityForm({ type: 'note', description: '', due_date: '' });
    load();
  };

  const toggleDone = async (activityId: string) => {
    await api.activities.toggle(activityId);
    load();
  };

  if (!deal) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div>
      <Link to="/deals" className="text-sm text-brand-blue hover:underline mb-4 inline-block">&larr; Back to Deals</Link>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{deal.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">${deal.value?.toLocaleString()}</p>
          </div>
          <span className={`badge badge-${deal.stage}`}>{DEAL_STAGE_LABELS[deal.stage]}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Organization:</span>{' '}
            {deal.organization_name ? (
              <Link to={`/organizations/${deal.organization_id}`} className="text-brand-blue hover:underline">{deal.organization_name}</Link>
            ) : <span className="text-gray-800 dark:text-gray-200">—</span>}
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Contact:</span>{' '}
            {deal.contact_name ? (
              <Link to={`/contacts/${deal.contact_id}`} className="text-brand-blue hover:underline">{deal.contact_name}</Link>
            ) : <span className="text-gray-800 dark:text-gray-200">—</span>}
          </div>
          <div><span className="text-gray-500 dark:text-gray-400">Close Date:</span> <span className="text-gray-800 dark:text-gray-200">{deal.close_date || '—'}</span></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Activity Timeline</h2>
          <button className="btn-primary text-xs" onClick={() => setShowActivityModal(true)}>+ Log Activity</button>
        </div>
        {deal.activities?.length > 0 ? (
          <div className="space-y-3">
            {deal.activities.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <span className={`badge ${
                  a.type === 'note' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                  a.type === 'call' ? 'badge-qualified' : 'badge-customer'
                }`}>
                  {a.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{a.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {a.activity_date}
                    {a.contact_name && <span> · {a.contact_name}</span>}
                    {a.due_date && <span> · Due: {a.due_date}</span>}
                  </p>
                </div>
                {a.due_date && (
                  <button
                    onClick={() => toggleDone(a.id)}
                    className={`text-xs px-2 py-1 rounded ${a.done ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}
                  >
                    {a.done ? 'Done' : 'Pending'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 text-sm">No activity yet</p>
        )}
      </div>

      {showActivityModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Log Activity</h2>
            <form onSubmit={handleAddActivity}>
              <div className="space-y-3">
                <select className="input w-full" value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>
                  {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <textarea className="input w-full" placeholder="Description" rows={3} value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} required />
                <input className="input w-full" type="date" placeholder="Due date (optional)" value={activityForm.due_date} onChange={(e) => setActivityForm({ ...activityForm, due_date: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="btn-secondary" onClick={() => setShowActivityModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

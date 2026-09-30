import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function OrganizationDetail() {
  const { id } = useParams();
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    if (id) api.organizations.get(id).then(setOrg);
  }, [id]);

  if (!org) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div>
      <Link to="/organizations" className="text-sm text-brand-blue hover:underline mb-4 inline-block">&larr; Back to Organizations</Link>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{org.name}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500 dark:text-gray-400">Industry:</span> <span className="text-gray-800 dark:text-gray-200">{org.industry || '—'}</span></div>
          <div><span className="text-gray-500 dark:text-gray-400">Website:</span> <span className="text-gray-800 dark:text-gray-200">{org.website || '—'}</span></div>
          <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">Notes:</span> <span className="text-gray-800 dark:text-gray-200">{org.notes || '—'}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Contacts</h2>
          {org.contacts?.length > 0 ? (
            <div className="space-y-2">
              {org.contacts.map((c: any) => (
                <Link key={c.id} to={`/contacts/${c.id}`} className="block py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/50">
                  <p className="text-sm font-medium text-brand-blue">{c.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{c.job_title} · {c.email}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No contacts</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Deals</h2>
          {org.deals?.length > 0 ? (
            <div className="space-y-2">
              {org.deals.map((d: any) => (
                <Link key={d.id} to={`/deals/${d.id}`} className="block py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/50">
                  <p className="text-sm font-medium text-brand-blue">{d.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    <span className={`badge badge-${d.stage}`}>{d.stage}</span>
                    {' · '}${d.value?.toLocaleString()} · {d.contact_name}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No deals</p>
          )}
        </div>
      </div>
    </div>
  );
}

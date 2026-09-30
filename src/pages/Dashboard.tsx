import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const { dark } = useTheme();

  useEffect(() => {
    api.dashboard.stats().then(setStats);
  }, []);

  if (!stats) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Deals Won Per Month</h2>
          {stats.dealsWonPerMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.dealsWonPerMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f0f0f0'} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: dark ? '#9ca3af' : '#6b7280' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: dark ? '#9ca3af' : '#6b7280' }} />
                <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb', color: dark ? '#f3f4f6' : '#111827' }} />
                <Bar dataKey="count" fill="#209dd7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">No won deals yet</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Revenue Won Per Month</h2>
          {stats.revenuePerMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.revenuePerMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f0f0f0'} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: dark ? '#9ca3af' : '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: dark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb', color: dark ? '#f3f4f6' : '#111827' }} />
                <Line type="monotone" dataKey="total" stroke="#ecad0a" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">No revenue data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Recent Activity</h2>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <span className={`badge ${
                    a.type === 'note' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                    a.type === 'call' ? 'badge-qualified' : 'badge-customer'
                  }`}>
                    {a.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{a.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {a.contact_name && <span>{a.contact_name}</span>}
                      {a.contact_name && a.deal_name && <span> · </span>}
                      {a.deal_name && <span>{a.deal_name}</span>}
                      {' · '}{a.activity_date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">No activity yet</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Tasks (Upcoming & Overdue)</h2>
          {stats.tasks.length > 0 ? (
            <div className="space-y-2">
              {stats.tasks.map((t: any) => {
                const isOverdue = !t.done && new Date(t.due_date) < new Date(new Date().toDateString());
                return (
                  <div key={t.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                    <input
                      type="checkbox"
                      checked={t.done}
                      readOnly
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${t.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{t.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Due: {t.due_date}
                        {isOverdue && <span className="text-red-500 dark:text-red-400 ml-1 font-medium">Overdue</span>}
                      </p>
                    </div>
                    <span className={`badge ${t.type === 'note' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : t.type === 'call' ? 'badge-qualified' : 'badge-customer'}`}>
                      {t.type}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">No tasks</p>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiFetch';

const INTEGRATIONS = [
  'Meta (Facebook and Instagram)',
  'WhatsApp Business',
  'Google Ads',
  'Google Analytics',
  'Google Business Profile',
];

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-600 mt-1">{label}</div>
    </div>
  );
}

export default function DashboardHome() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const r = await apiFetch('/api/dashboard/summary');
      if (!r.ok) return setError(r.error);
      setData(r.data);
    })();
  }, []);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-slate-500 text-sm">Loading…</p>;

  const { counts, recentBrands } = data;
  const firstBrand = recentBrands[0];
  const brandHref = firstBrand ? `/dashboard/brands/${firstBrand._id}` : '/dashboard/brands';

  const steps = [
    { label: 'Add your first brand', done: counts.brands > 0, href: '/dashboard/brands' },
    { label: 'Run a website audit', done: counts.auditsDone > 0, href: brandHref },
    { label: 'Add and confirm a competitor', done: counts.competitors > 0, href: brandHref },
    { label: 'Compare with competitors', done: counts.comparisonsDone > 0, href: brandHref },
    { label: 'Generate a funnel draft', done: counts.funnels > 0, href: brandHref },
  ];
  const next = steps.find((s) => !s.done);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Home</h1>

      {next ? (
        <Link href={next.href} className="mt-4 block bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-5">
          <div className="text-sm opacity-90">Next step</div>
          <div className="text-lg font-semibold">{next.label}</div>
        </Link>
      ) : (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-5 text-sm">
          You have completed every available step. Campaign drafts and approvals come in the next phase.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Brands" value={counts.brands} />
        <Stat label="Audits completed" value={counts.auditsDone} />
        <Stat label="Competitors confirmed" value={counts.competitors} />
        <Stat label="Funnel versions" value={counts.funnels} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-bold text-slate-900 mb-3">Getting started</h2>
          <ul className="grid gap-2">
            {steps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-3 text-sm text-slate-800 hover:text-indigo-700">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      s.done ? 'bg-emerald-600 text-white' : 'border border-slate-300 text-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className={s.done ? 'line-through text-slate-400' : ''}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">Recent brands</h2>
            <Link href="/dashboard/brands" className="text-sm text-indigo-600 hover:underline">All brands</Link>
          </div>
          {recentBrands.length === 0 ? (
            <p className="text-sm text-slate-600">No brands yet.</p>
          ) : (
            <ul className="grid gap-2">
              {recentBrands.map((b) => (
                <li key={b._id}>
                  <Link href={`/dashboard/brands/${b._id}`} className="block text-sm hover:text-indigo-700">
                    <span className="font-medium text-slate-900">{b.name}</span>
                    <span className="block text-xs text-slate-500">{b.websiteUrl}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-bold text-slate-900">Connected accounts</h2>
        <p className="text-sm text-slate-600 mt-1">
          No accounts are connected, so there are no leads, ad results or revenue to show yet. Those numbers will appear
          only after a real integration is connected.
        </p>
        <ul className="mt-3 grid sm:grid-cols-2 gap-2">
          {INTEGRATIONS.map((name) => (
            <li key={name} className="flex items-center justify-between text-sm border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-slate-800">{name}</span>
              <span className="text-xs text-slate-500">Not connected</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

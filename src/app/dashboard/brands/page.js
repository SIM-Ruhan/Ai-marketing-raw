'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiFetch';

export default function BrandsPage() {
  const [brands, setBrands] = useState(null);
  const [form, setForm] = useState({ name: '', websiteUrl: '', industry: '', country: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const r = await apiFetch('/api/brands');
    if (!r.ok) {
      setBrands([]);
      return setError(r.error);
    }
    setBrands(r.data.brands);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await apiFetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setForm({ name: '', websiteUrl: '', industry: '', country: '' });
    load();
  }

  const input = 'w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm';

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Brands</h1>

      <form onSubmit={handleAdd} className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Brand name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={input} placeholder="Website, e.g. https://example.com" required value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
        <input className={input} placeholder="Industry (optional)" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
        <input className={input} placeholder="Country (optional)" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <div className="sm:col-span-2 flex items-center gap-4">
          <button disabled={busy} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60">
            {busy ? 'Adding…' : 'Add brand'}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      <div className="mt-8">
        {brands === null ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : brands.length === 0 ? (
          <p className="text-slate-600 text-sm">No brands yet. Add your first brand above, then run an audit on it.</p>
        ) : (
          <ul className="grid gap-3">
            {brands.map((b) => (
              <li key={b._id}>
                <Link href={`/dashboard/brands/${b._id}`} className="block bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4">
                  <div className="font-semibold text-slate-900">{b.name}</div>
                  <div className="text-sm text-slate-500">{b.websiteUrl}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
